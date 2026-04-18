(function () {
  "use strict";

  var STORAGE_KEY = "wishlist_items_v1";

  function getItems() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function findItemIndex(variantId) {
    var items = getItems();
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].variantId) === String(variantId)) return i;
    }
    return -1;
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
        if (toast.parentNode) toast.parentNode.removeChild(toast);
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

  function syncAll() {
    var items = getItems();
    var map = {};

    for (var i = 0; i < items.length; i++) {
      map[String(items[i].variantId)] = true;
    }

    var btns = document.querySelectorAll("[data-wl-toggle]");
    for (var j = 0; j < btns.length; j++) {
      var vid = btns[j].getAttribute("data-variant-id");
      if (!vid) continue;
      markButton(btns[j], !!map[String(vid)]);
    }

    setCount(items.length);
  }

  function toggleItem(productId, variantId) {
    var items = getItems();
    var idx = findItemIndex(variantId);

    if (idx > -1) {
      items.splice(idx, 1);
      saveItems(items);
      return { ok: true, wishlisted: false };
    }

    items.push({
      productId: String(productId),
      variantId: String(variantId),
      addedAt: Date.now()
    });

    saveItems(items);
    return { ok: true, wishlisted: true };
  }

  document.addEventListener("click", function (e) {
    var node = e.target;
    while (node && node !== document) {
      if (node.hasAttribute && node.hasAttribute("data-wl-toggle")) break;
      node = node.parentNode;
    }
    if (!node || node === document) return;

    e.preventDefault();

    var btn = node;
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
      var wasActive = btn.classList.contains("is-active");
      var result = toggleItem(productId, variantId);

      if (result && result.ok) {
        syncAll();
        showToast(wasActive ? "Removed from wishlist" : "Added to wishlist");
      } else {
        showToast("Add to wishlist failed", true);
      }
    } catch (err) {
      console.error("Wishlist failed:", err);
      showToast("Something went wrong", true);
    } finally {
      btn.dataset.loading = "0";
      btn.disabled = false;
    }
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

    syncAll();
  });

  window.addEventListener("load", function () {
    syncAll();
  });

  window.WishlistUI = {
    sync: syncAll,
    getItems: getItems
  };
})();