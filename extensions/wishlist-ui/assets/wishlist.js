/* wishlist.js – FINAL (proxy-safe + shop-aware + merge-safe + UI-safe) */
(function() {
    "use strict";

    var STORAGE_GUEST_ID = "wl_guest_id";
    var STORAGE_MERGED = "wl_merged_customer";

    function getShopDomain() {
        // Preferred
        if (window.Shopify && window.Shopify.shop) return String(window.Shopify.shop);

        // Optional fallbacks if you ever set it from liquid
        if (window.WISHLIST_SHOP) return String(window.WISHLIST_SHOP);

        // Last resort: try to infer from location host (works only on .myshopify.com)
        var h = window.location.host || "";
        if (h.indexOf(".myshopify.com") !== -1) return h;

        return "";
    }

    function ensureGuestId() {
        var gid = localStorage.getItem(STORAGE_GUEST_ID);
        if (!gid) {
            gid = "guest:" + Date.now() + "-" + Math.random().toString(16).slice(2);
            localStorage.setItem(STORAGE_GUEST_ID, gid);
        }
        return gid;
    }

    function getLoggedInCustomerId() {
        if (
            typeof window.wishlistCustomerId !== "undefined" &&
            window.wishlistCustomerId !== null &&
            window.wishlistCustomerId !== ""
        ) {
            return String(window.wishlistCustomerId);
        }
        return null;
    }

    function getActiveCustomerId() {
        return getLoggedInCustomerId() || ensureGuestId();
    }

    async function safeJson(res) {
        try {
            return await res.json();
        } catch (e) {
            return null;
        }
    }

    function setCount(n) {
        var els = document.querySelectorAll("[data-wl-count]");
        for (var i = 0; i < els.length; i++) {
            els[i].textContent = String(n);
            els[i].style.display = n > 0 ? "" : "none";
        }
    }

    function markButton(btn, active) {
        btn.classList.toggle("is-active", !!active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");

        var label = btn.querySelector("[data-wl-label]");
        if (label) label.textContent = active ? "Wishlisted" : "Wishlist";
    }

    function disableWishlistUI(reason) {
        var btns = document.querySelectorAll("[data-wl-toggle]");
        for (var i = 0; i < btns.length; i++) {
            btns[i].disabled = true;
            btns[i].classList.add("wl-disabled");
            btns[i].setAttribute("aria-disabled", "true");

            var label = btns[i].querySelector("[data-wl-label]");
            if (label) {
                label.textContent =
                    reason === "billing" ?
                    "Upgrade to use Wishlist" :
                    reason === "disabled" ?
                    "Wishlist Disabled" :
                    "Wishlist Unavailable";
            }
        }

        setCount(0);
    }

    // -------------------------
    // API (SHOP-AWARE)
    // -------------------------
    function withShop(url) {
        var shop = getShopDomain();
        // If shop missing, keep URL (dev), but it may 400 in prod — better to log
        if (!shop) {
            try {
                console.warn("Wishlist: Shopify.shop missing — proxy may return 400");
            } catch (_) {}
            return url;
        }
        var sep = url.indexOf("?") === -1 ? "?" : "&";
        return url + sep + "shop=" + encodeURIComponent(shop);
    }

    async function apiStatus() {
        // Optional endpoint. Fail-open always.
        try {
            var res = await fetch(withShop("/apps/wishlist/status"), {
                credentials: "same-origin",
                cache: "no-store",
            });

            if (res.status === 402) return { ok: false, active: false, reason: "billing" };

            var data = await safeJson(res);
            if (data && data.ok === true) {
                if (data.enabled === false) return { ok: false, active: false, reason: "disabled" };
                if (data.active === false) return { ok: false, active: false, reason: "inactive" };
                return { ok: true, active: true };
            }

            // if status doesn't exist, do not block UI
            return { ok: true, active: true, reason: "fallback" };
        } catch (e) {
            return { ok: true, active: true, reason: "fallback-error" };
        }
    }

    async function apiToggle(customerId, productId, variantId) {
        var res = await fetch(withShop("/apps/wishlist/toggle"), {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
            credentials: "same-origin",
            body: new URLSearchParams({
                customerId: String(customerId),
                productId: String(productId),
                variantId: String(variantId),
            }),
        });

        if (res.status === 402) return { ok: false, billingRequired: true };

        var data = await safeJson(res);
        return data || { ok: false };
    }

    async function apiList(customerId) {
        var res = await fetch(
            withShop("/apps/wishlist/list?customerId=" + encodeURIComponent(String(customerId))), {
                credentials: "same-origin",
                cache: "no-store",
            }
        );

        if (res.status === 402) return { items: [], billingRequired: true };
        if (!res.ok) return { items: [] };

        var data = await safeJson(res);
        return data || { items: [] };
    }

    async function apiMerge(fromId, toId) {
        var res = await fetch(withShop("/apps/wishlist/merge"), {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
            credentials: "same-origin",
            body: new URLSearchParams({
                fromCustomerId: String(fromId),
                toCustomerId: String(toId),
            }),
        });

        if (res.status === 402) return { ok: false, billingRequired: true };

        var data = await safeJson(res);
        return data || { ok: false };
    }

    // -------------------------
    // Resolve best customer id for UI
    // (important when user is logged in but guest items exist)
    // -------------------------
    async function resolveCustomerIdForUI() {
        var logged = getLoggedInCustomerId();
        var guest = localStorage.getItem(STORAGE_GUEST_ID) || ensureGuestId();

        if (!logged) return String(guest);

        // Prefer logged-in id if it already has items
        var d1 = await apiList(String(logged));
        if (d1 && d1.items && d1.items.length) return String(logged);

        // Else if guest has items, use guest until merge runs
        var d2 = await apiList(String(guest));
        if (d2 && d2.items && d2.items.length) return String(guest);

        return String(logged);
    }

    async function syncAll() {
        var cid = await resolveCustomerIdForUI();
        var data = await apiList(cid);

        if (data && data.billingRequired) {
            disableWishlistUI("billing");
            return;
        }

        var items = data.items || [];
        var map = {};
        for (var i = 0; i < items.length; i++) {
            map[String(items[i].variantId)] = true;
        }

        var btns = document.querySelectorAll("[data-wl-toggle]");
        for (var j = 0; j < btns.length; j++) {
            var vid = btns[j].getAttribute("data-variant-id");
            if (!vid) continue;
            markButton(btns[j], !!map[vid]);
        }

        setCount(items.length);
    }

    async function mergeIfNeeded() {
        var customerId = getLoggedInCustomerId();
        if (!customerId) return;

        var merged = localStorage.getItem(STORAGE_MERGED);
        if (merged === customerId) return;

        var guestId = localStorage.getItem(STORAGE_GUEST_ID);
        if (!guestId) return;

        var r = await apiMerge(guestId, customerId);
        if (r && r.ok) {
            localStorage.setItem(STORAGE_MERGED, customerId);
        }
    }

    // -------------------------
    // Events: toggle button
    // -------------------------
    document.addEventListener("click", async function(e) {
        var node = e.target;
        while (node && node !== document) {
            if (node.hasAttribute && node.hasAttribute("data-wl-toggle")) break;
            node = node.parentNode;
        }
        if (!node || node === document) return;

        var btn = node;
        e.preventDefault();

        if (btn.dataset.loading === "1") return;
        btn.dataset.loading = "1";
        btn.disabled = true;

        try {
            var st = await apiStatus(); // fail-open
            if (!st.ok) {
                disableWishlistUI(st.reason);
                return;
            }

            document.documentElement.classList.add("wishlist-ready");
            if (st.active) document.documentElement.classList.add("wishlist-paid");

            await mergeIfNeeded();

            var result = await apiToggle(
                getActiveCustomerId(),
                btn.getAttribute("data-product-id"),
                btn.getAttribute("data-variant-id")
            );

            if (result && result.billingRequired) {
                disableWishlistUI("billing");
                return;
            }

            if (result && result.ok) {
                await syncAll();
            }
        } catch (err) {
            try {
                console.error("Wishlist failed", err);
            } catch (_) {}
        } finally {
            btn.dataset.loading = "0";
            btn.disabled = false;
        }
    });

    // -------------------------
    // Init
    // -------------------------
    window.addEventListener("load", async function() {
        document.documentElement.classList.add("wishlist-ready");

        var st = await apiStatus();
        if (!st.ok) {
            disableWishlistUI(st.reason);
            return;
        }
        if (st.active) document.documentElement.classList.add("wishlist-paid");

        await mergeIfNeeded();
        await syncAll();
    });

    // Expose small API for page section
    window.WishlistUI = {
        sync: syncAll,
        getCustomerId: getActiveCustomerId,
        resolveCustomerIdForUI: resolveCustomerIdForUI,
        getShop: getShopDomain,
    };
})();