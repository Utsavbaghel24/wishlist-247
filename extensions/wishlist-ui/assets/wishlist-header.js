/* wishlist-header.js - auto-insert wishlist icon into header (STABLE) */
(function() {
    "use strict";

    function ready(fn) {
        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
        else fn();
    }

    function qs(sel, root) {
        return (root || document).querySelector(sel);
    }

    function getWishlistUrl() {
        return (window.WISHLIST_PAGE_URL && String(window.WISHLIST_PAGE_URL)) || "/pages/wishlist";
    }

    function buildNode() {
        var a = document.createElement("a");
        a.className = "wl-nav wl-nav--auto";
        a.href = getWishlistUrl();

        // IMPORTANT: do not conflict with page/drawer click handlers
        a.setAttribute("data-wl-nav-auto", "1");

        a.innerHTML =
            '<span class="wl-ico" aria-hidden="true">❤</span>' +
            '<span class="wl-label">Wishlist</span>' +
            '<span class="wl-badge" data-wl-count style="display:none">0</span>';

        return a;
    }

    function injectStylesOnce() {
        if (qs("#wl-header-style")) return;

        var style = document.createElement("style");
        style.id = "wl-header-style";
        style.textContent = `
      .wl-nav{
        display:inline-flex; align-items:center; gap:8px;
        text-decoration:none; color:inherit;
        font-weight:700; position:relative; line-height:1;
        white-space:nowrap;
      }
      .wl-nav .wl-ico{ color:#ff2ea1; font-size:18px; line-height:1; }
      .wl-nav .wl-badge{
        position:absolute; top:-8px; left:14px;
        min-width:18px; height:18px; padding:0 5px;
        border-radius:999px; background:#000; color:#fff;
        font-size:12px; display:none; align-items:center; justify-content:center;
      }
      .wl-nav--auto{ margin-left: 10px; }
      @media (max-width: 749px){
        .wl-nav .wl-label{ display:none; }
        .wl-nav--auto{ margin-left: 8px; }
      }
    `;
        document.head.appendChild(style);
    }

    // ✅ Better container detection, incl. Stiletto patterns
    function findHeaderIconContainer() {
        var candidates = [
            /* Stiletto-ish / common "header actions" */
            ".header__icon-wrapper",
            ".header__icons",
            ".header__icons-wrapper",
            ".header__icons .list-unstyled",
            ".header__secondary-nav",
            ".header__right",
            ".header-right",

            /* Dawn-like */
            ".header__icon-list",

            /* Generic */
            ".site-header__icons",
            ".site-header__icon-wrapper",
            ".header-icons",
            ".header-icons__wrapper",

            /* Data hooks */
            "[data-header-icons]",
            "[data-header-actions]",
            "[data-site-header-actions]",
            "[data-header-right]"
        ];

        for (var i = 0; i < candidates.length; i++) {
            var el = qs(candidates[i]);
            if (el) return el;
        }

        // Fallback: locate cart and use its parent
        var cart =
            qs('a[href^="/cart"]') ||
            qs('a[href*="/cart"]') ||
            qs('[aria-controls*="CartDrawer"]') ||
            qs('[data-cart-icon]');

        if (cart && cart.parentElement) return cart.parentElement;

        return null;
    }

    function alreadyMounted(container) {
        if (!container) return true;
        return !!qs(".wl-nav--auto", container);
    }

    function mount() {
        injectStylesOnce();

        var container = findHeaderIconContainer();
        if (!container) return;

        if (alreadyMounted(container)) return;

        var node = buildNode();

        // Insert close to cart (Campus style)
        var cartIn =
            qs('a[href^="/cart"]', container) ||
            qs('a[href*="/cart"]', container) ||
            qs('[aria-controls*="CartDrawer"]', container) ||
            qs('[data-cart-icon]', container);

        if (cartIn && cartIn.parentNode === container) {
            container.insertBefore(node, cartIn);
            return;
        }

        container.appendChild(node);
    }

    /* ✅ No alert. If page missing, do customer-safe fallback.
       We detect page existence ONLY when clicking.
       For customers: redirect to /account (no 404).
       For devs: allow console message. */
    async function pageExists(url) {
        try {
            var res = await fetch(url, { method: "GET", credentials: "same-origin" });
            if (!res.ok) return false;
            var txt = await res.text();
            if (/page not found/i.test(txt)) return false;
            return true;
        } catch (e) {
            return false;
        }
    }

    function attachClickGuard() {
        document.addEventListener("click", async function(e) {
            var a = e.target.closest("[data-wl-nav-auto]");
            if (!a) return;

            var url = a.getAttribute("href") || "/pages/wishlist";

            // Cache per session
            var key = "wl_page_ok:" + url;
            var cached = sessionStorage.getItem(key);

            if (cached === "1") return; // normal
            if (cached === "0") {
                e.preventDefault();
                window.location.href = "/account";
                return;
            }

            var ok = await pageExists(url);
            sessionStorage.setItem(key, ok ? "1" : "0");

            if (!ok) {
                e.preventDefault();
                // Customer-safe fallback (no alert)
                window.location.href = "/account";
                // Dev hint
                try { console.warn("Wishlist page missing. Create Shopify page handle: wishlist -> /pages/wishlist"); } catch (_) {}
            }
        });
    }

    /* ✅ MutationObserver: throttle so it doesn't run 1000 times */
    function observeHeader() {
        var target = document.body;
        if (!target) return;

        var ticking = false;
        var obs = new MutationObserver(function() {
            if (ticking) return;
            ticking = true;
            setTimeout(function() {
                ticking = false;
                mount();
            }, 150);
        });

        obs.observe(target, { childList: true, subtree: true });
    }

    ready(function() {
        mount();
        setTimeout(mount, 700);
        setTimeout(mount, 1600);

        attachClickGuard();
        observeHeader();
    });
})();