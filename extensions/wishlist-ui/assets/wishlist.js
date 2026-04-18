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

  function withShop(url) {
    var shop = getShopDomain();
    if (!shop) return url;

    var sep = url.indexOf("?") === -1 ? "?" : "&";
    return url + sep + "shop=" + encodeURIComponent(shop);
  }

  function showToast(message, isError) {
    var oldToast = document.getElementById("wl-toast");
    if (oldToast) oldToast.remove();

    var toast = document.createElement("div");
    toast.id = "wl-toast";
    toast.className = "wl-toast" + (isError ? " is-error" : "");
    toast.textContent = message;

    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add("show");
    });

    setTimeout(function () {
      toast.classList.remove("show");
      setTimeout(function () {
        if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 2200);
  }

  function setCount(n) {
    var count = Number(n || 0);

    var els = document.querySelectorAll("[data-wl-count]");
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = String(count);

      if (count > 0) {
        els[i].classList.add("wl-show");
        els[i].style.display = "flex";
      } else {
        els[i].classList.remove("wl-show");
        els[i].style.display = "none";
      }
    }

    document.dispatchEvent(
      new CustomEvent("wishlist:count-updated", {
        detail: { count: count },
      })
    );
  }

  function markButton(btn, active) {
    btn.classList.toggle("is-active", !!active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");

    var label = btn.querySelector("[data-wl-label]");
    if (label) {
      label.textContent = active ? "Wishlisted" : "Add to wishlist";
    }
  }

  function disableWishlistUI(reason) {
    var wrappers = document.querySelectorAll(".wishlist-ui");
    for (var i = 0; i < wrappers.length; i++) {
      wrappers[i].classList.add("wl-disabled-ui");
    }

    var btns = document.querySelectorAll("[data-wl-toggle]");
    for (var j = 0; j < btns.length; j++) {
      btns[j].disabled = true;
      btns[j].classList.add("wl-disabled");
      btns[j].setAttribute("aria-disabled", "true");

      var label = btns[j].querySelector("[data-wl-label]");
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

      return { ok: true, active: true };
    } catch (e) {
      return { ok: true, active: true };
    }
  }

  async function apiToggle(customerId, productId, variantId) {
    try {
      var params = new URLSearchParams({
        customerId: String(customerId),
        productId: String(productId),
        variantId: String(variantId),
      });

var url = withShop("/apps/wishlist/toggle?" + params.toString());

      var res = await fetch(url, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      var text = await res.text();

      var data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        return { ok: false, error: "Wishlist API returned HTML instead of JSON" };
      }

      if (res.status === 402) return { ok: false, billingRequired: true };
      if (!res.ok) return { ok: false, error: data?.error || "Request failed" };

      return data || { ok: false, error: "Empty response" };
    } catch (e) {
      return { ok: false, error: e.message || "Unknown error" };
    }
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
    try {
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
    } catch (e) {
      return { ok: false };
    }
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
    var node = e.target;
    while (node && node !== document) {
      if (node.hasAttribute && node.hasAttribute("data-wl-toggle")) break;
      node = node.parentNode;
    }
    if (!node || node === document) return;

    var btn = node;
    e.preventDefault();

    if (btn.dataset.loading === "1") return;

    var productId = btn.getAttribute("data-product-id");
    var variantId = btn.getAttribute("data-variant-id");

    if (!productId || !variantId) {
      showToast("Product data missing", true);
      return;
    }

    btn.dataset.loading = "1";
    btn.disabled = true;

    try {
      var st = await apiStatus();
      if (!st.ok) {
        disableWishlistUI(st.reason);
        showToast("Wishlist unavailable", true);
        return;
      }

      document.documentElement.classList.add("wishlist-ready");
      if (st.active) document.documentElement.classList.add("wishlist-paid");

      await mergeIfNeeded();

      var wasActive = btn.classList.contains("is-active");
      var result = await apiToggle(getActiveCustomerId(), productId, variantId);

      if (result && result.billingRequired) {
        disableWishlistUI("billing");
        showToast("Billing required for wishlist", true);
        return;
      }

   if (result && result.ok) {
  await syncAll();
  showToast(wasActive ? "Removed from wishlist" : "Added to wishlist");
} else {
  console.error("Wishlist toggle failed:", result);
  showToast(
    result && result.error
      ? String(result.error).slice(0, 120)
      : "Add to wishlist failed",
    true
  );
}
    } catch (err) {
      showToast("Something went wrong", true);
    } finally {
      btn.dataset.loading = "0";
      btn.disabled = false;
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

  document.addEventListener("change", function (e) {
    var input = e.target;
    if (!input) return;

    var form = input.closest("form");
    if (!form) return;

    var variantInput = form.querySelector('input[name="id"], select[name="id"]');
    if (!variantInput) return;

    var variantId = variantInput.value;
    if (!variantId) return;

    var btns = document.querySelectorAll("[data-wl-toggle]");
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute("data-variant-id", variantId);
    }
  });

  window.WishlistUI = {
    sync: syncAll,
    getCustomerId: getActiveCustomerId,
    resolveCustomerIdForUI: resolveCustomerIdForUI,
    getShop: getShopDomain,
    toast: showToast,
  };
})();