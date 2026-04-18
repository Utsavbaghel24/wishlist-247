/* wishlist.js – FULL REPLACEMENT */
(function () {
  "use strict";

  var STORAGE_GUEST_ID = "wl_guest_id";
  var STORAGE_MERGED = "wl_merged_customer";

  function getShopDomain() {
    if (window.Shopify && window.Shopify.shop) return String(window.Shopify.shop);
    if (window.WISHLIST_SHOP) return String(window.WISHLIST_SHOP);

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
    var count = Number(n || 0);

    var els = document.querySelectorAll("[data-wl-count]");
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = String(count);
      els[i].style.display = count > 0 ? "flex" : "none";
    }

    var floatingLink = document.getElementById("wl-floating-link");
    if (floatingLink) {
      if (count > 0) {
        floatingLink.classList.add("wl-show");
        floatingLink.style.display = "flex";
      } else {
        floatingLink.classList.remove("wl-show");
        floatingLink.style.display = "none";
      }
    }
  }

  function markButton(btn, active) {
    if (!btn) return;

    btn.classList.toggle("is-active", !!active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");

    var label = btn.querySelector("[data-wl-label]");
    if (label) {
      label.textContent = active ? "Wishlisted" : "Add to wishlist";
    }
  }

  function setButtonLoading(btn, loading) {
    if (!btn) return;

    btn.classList.toggle("wl-loading", !!loading);
    btn.disabled = !!loading;
  }

  function disableWishlistUI(reason) {
    document.querySelectorAll(".wishlist-ui").forEach(function (el) {
      el.classList.add("wl-disabled-ui");
    });

    var btns = document.querySelectorAll("[data-wl-toggle]");
    for (var i = 0; i < btns.length; i++) {
      btns[i].disabled = true;
      btns[i].classList.add("wl-disabled");
      btns[i].setAttribute("aria-disabled", "true");

      var label = btns[i].querySelector("[data-wl-label]");
      if (label) {
        label.textContent =
          reason === "billing"
            ? "Upgrade to use Wishlist"
            : reason === "disabled"
            ? "Wishlist Disabled"
            : "Wishlist Unavailable";
      }
    }

    setCount(0);
  }

  function showToast(message) {
    var toast = document.getElementById("wl-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "wl-toast";
      toast.style.position = "fixed";
      toast.style.left = "18px";
      toast.style.bottom = "88px";
      toast.style.zIndex = "100000";
      toast.style.background = "#111";
      toast.style.color = "#fff";
      toast.style.padding = "12px 16px";
      toast.style.borderRadius = "10px";
      toast.style.fontSize = "14px";
      toast.style.fontWeight = "500";
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.25s ease";
      toast.style.pointerEvents = "none";
      toast.style.maxWidth = "260px";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";

    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(function () {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
    }, 2200);
  }

  function withShop(url) {
    var shop = getShopDomain();

    if (!shop) {
      try {
        console.warn("Wishlist: Shopify.shop missing — proxy may fail");
      } catch (_) {}
      return url;
    }

    var sep = url.indexOf("?") === -1 ? "?" : "&";
    return url + sep + "shop=" + encodeURIComponent(shop);
  }

  async function apiStatus() {
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

      return { ok: true, active: true, reason: "fallback" };
    } catch (e) {
      return { ok: true, active: true, reason: "fallback-error" };
    }
  }

  async function apiToggle(customerId, productId, variantId) {
    var res = await fetch(withShop("/apps/wishlist/toggle"), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
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
      withShop("/apps/wishlist/list?customerId=" + encodeURIComponent(String(customerId))),
      {
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
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
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

  async function resolveCustomerIdForUI() {
    var logged = getLoggedInCustomerId();
    var guest = localStorage.getItem(STORAGE_GUEST_ID) || ensureGuestId();

    if (!logged) return String(guest);

    var d1 = await apiList(String(logged));
    if (d1 && d1.items && d1.items.length) return String(logged);

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

  document.addEventListener("click", async function (e) {
    var btn = e.target.closest("[data-wl-toggle]");
    if (!btn) return;

    e.preventDefault();

    var productId = btn.getAttribute("data-product-id");
    var variantId = btn.getAttribute("data-variant-id");
    var customerId = getActiveCustomerId();

    if (!productId || !variantId) {
      console.error("Wishlist: Missing productId or variantId");
      showToast("Wishlist unavailable");
      return;
    }

    setButtonLoading(btn, true);

    try {
      var data = await apiToggle(customerId, productId, variantId);

      if (data && data.billingRequired) {
        disableWishlistUI("billing");
        showToast("Billing required");
        return;
      }

      if (data && data.ok) {
        markButton(btn, !!data.wishlisted);
        await syncAll();
        showToast(data.wishlisted ? "Added to wishlist" : "Removed from wishlist");
      } else {
        console.error("Wishlist toggle failed:", data);
        showToast("Wishlist failed");
      }
    } catch (err) {
      console.error("Wishlist toggle error:", err);
      showToast("Something went wrong");
    } finally {
      setButtonLoading(btn, false);
    }
  });

  window.addEventListener("load", async function () {
    document.documentElement.classList.add("wishlist-ready");

    var st = await apiStatus();
    if (!st.ok) {
      disableWishlistUI(st.reason);
      return;
    }

    if (st.active) {
      document.documentElement.classList.add("wishlist-paid");
    }

    await mergeIfNeeded();
    await syncAll();
  });

  window.WishlistUI = {
    sync: syncAll,
    getCustomerId: getActiveCustomerId,
    resolveCustomerIdForUI: resolveCustomerIdForUI,
    getShop: getShopDomain,
    loaded: true,
  };

  console.log("Wishlist.js loaded ✅");
})();