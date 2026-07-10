/* dNthrifts — shared cart logic (localStorage-based, no backend required) */
(function () {
  var CART_KEY = 'dnthrifts_cart';

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateBagBadge();
    renderDrawer();
  }

  function keyOf(item) {
    return item.name + '__' + (item.size || '');
  }

  function addToCart(item) {
    var cart = getCart();
    var existing = cart.find(function (i) { return keyOf(i) === keyOf(item); });
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      item.qty = 1;
      cart.push(item);
    }
    saveCart(cart);
    return cart;
  }

  function buyNow(item) {
    item.qty = 1;
    saveCart([item]);
    window.location.href = 'buy.html';
  }

  function setQty(index, qty) {
    var cart = getCart();
    if (!cart[index]) return cart;
    if (qty < 1) {
      cart.splice(index, 1);
    } else {
      cart[index].qty = qty;
    }
    saveCart(cart);
    return cart;
  }

  function removeFromCart(index) {
    var cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    return cart;
  }

  function clearCart() {
    saveCart([]);
  }

  function itemCount(cart) {
    return (cart || getCart()).reduce(function (sum, item) { return sum + (item.qty || 1); }, 0);
  }

  function cartTotal(cart) {
    return (cart || getCart()).reduce(function (sum, item) {
      return sum + (parseFloat(item.price) || 0) * (item.qty || 1);
    }, 0);
  }

  function money(n) {
    return '$' + n.toFixed(2).replace(/\.00$/, '');
  }

  function updateBagBadge() {
    var count = itemCount();
    document.querySelectorAll('.nav-cart').forEach(function (btn) {
      btn.textContent = 'Bag (' + count + ')';
    });
  }

  function pulseBadge() {
    document.querySelectorAll('.nav-cart').forEach(function (btn) {
      btn.classList.remove('bag-pulse');
      void btn.offsetWidth;
      btn.classList.add('bag-pulse');
    });
  }

  function itemFromCard(card) {
    return {
      name: card.getAttribute('data-name') || 'Item',
      price: parseFloat(card.getAttribute('data-price')) || 0,
      size: card.getAttribute('data-size') || ''
    };
  }

  /* ---------------- TOASTS ---------------- */

  function ensureToastHost() {
    var host = document.getElementById('dnToastHost');
    if (host) return host;
    host = document.createElement('div');
    host.id = 'dnToastHost';
    host.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:10000;display:flex;flex-direction:column;gap:0.6rem;pointer-events:none;';
    document.body.appendChild(host);
    return host;
  }

  function toast(message) {
    var host = ensureToastHost();
    var el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = 'font-family:Helvetica,monospace;font-size:0.75rem;letter-spacing:0.05em;background:#3B2A1A;color:#F5F0E8;padding:0.85rem 1.3rem;box-shadow:0 8px 24px rgba(0,0,0,0.25);transform:translateX(120%);opacity:0;transition:transform 0.45s cubic-bezier(.34,1.56,.64,1), opacity 0.3s;';
    host.appendChild(el);
    requestAnimationFrame(function () {
      el.style.transform = 'translateX(0)';
      el.style.opacity = '1';
    });
    setTimeout(function () {
      el.style.transform = 'translateX(120%)';
      el.style.opacity = '0';
      setTimeout(function () { el.remove(); }, 400);
    }, 2200);
  }

  /* ---------------- FLY TO CART ---------------- */

  function flyToCart(sourceEl) {
    var navCart = document.querySelector('.nav-cart');
    if (!sourceEl || !navCart) return;
    var imgEl = sourceEl.closest('[data-item]');
    imgEl = imgEl ? imgEl.querySelector('img') : null;

    var startRect = (imgEl || sourceEl).getBoundingClientRect();
    var endRect = navCart.getBoundingClientRect();

    var clone = document.createElement('div');
    clone.style.cssText = [
      'position:fixed',
      'left:' + startRect.left + 'px',
      'top:' + startRect.top + 'px',
      'width:' + startRect.width + 'px',
      'height:' + startRect.height + 'px',
      'z-index:9999',
      'pointer-events:none',
      'border-radius:4px',
      'overflow:hidden',
      'box-shadow:0 10px 30px rgba(0,0,0,0.3)',
      'transition:transform 0.7s cubic-bezier(.55,-0.1,.3,1), opacity 0.7s ease, border-radius 0.7s'
    ].join(';');

    if (imgEl) {
      var img = document.createElement('img');
      img.src = imgEl.src;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
      clone.appendChild(img);
    } else {
      clone.style.background = '#B5522A';
    }

    document.body.appendChild(clone);

    var dx = endRect.left + endRect.width / 2 - (startRect.left + startRect.width / 2);
    var dy = endRect.top + endRect.height / 2 - (startRect.top + startRect.height / 2);

    requestAnimationFrame(function () {
      clone.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(0.08) rotate(12deg)';
      clone.style.opacity = '0.3';
      clone.style.borderRadius = '50%';
    });

    setTimeout(function () {
      clone.remove();
      pulseBadge();
    }, 720);
  }

  /* ---------------- DRAWER ---------------- */

  function ensureDrawer() {
    if (document.getElementById('dnCartDrawer')) return;

    var overlay = document.createElement('div');
    overlay.id = 'dnCartOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(59,42,26,0.4);opacity:0;pointer-events:none;transition:opacity 0.3s ease;z-index:9990;';

    var drawer = document.createElement('div');
    drawer.id = 'dnCartDrawer';
    drawer.style.cssText = [
      'position:fixed', 'top:0', 'right:0', 'height:100vh', 'width:min(400px,92vw)',
      'background:#F5F0E8', 'color:#3B2A1A', 'z-index:9991',
      'transform:translateX(100%)', 'transition:transform 0.5s cubic-bezier(.16,1,.3,1)',
      'display:flex', 'flex-direction:column', 'font-family:Helvetica,Arial,sans-serif',
      'box-shadow:-12px 0 40px rgba(0,0,0,0.25)'
    ].join(';');

    drawer.innerHTML =
      '<div style="padding:1.5rem 1.5rem 1rem;border-bottom:1.5px solid #3B2A1A;display:flex;justify-content:space-between;align-items:center;">' +
        '<span style="font-family:\'Playfair Display\',serif;font-size:1.3rem;font-weight:700;">Your Bag</span>' +
        '<button id="dnCartClose" style="background:none;border:none;font-size:1.4rem;line-height:1;cursor:pointer;color:#3B2A1A;">&times;</button>' +
      '</div>' +
      '<div id="dnCartItems" style="flex:1;overflow-y:auto;padding:1rem 1.5rem;"></div>' +
      '<div style="padding:1.25rem 1.5rem 1.75rem;border-top:1.5px solid #3B2A1A;">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:1rem;font-weight:700;">' +
          '<span style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;">Total</span>' +
          '<span id="dnCartTotal" style="font-size:1.3rem;color:#B5522A;">$0</span>' +
        '</div>' +
        '<a href="buy.html" style="display:block;text-align:center;font-family:Helvetica,monospace;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;background:#3B2A1A;color:#F5F0E8;padding:1rem;text-decoration:none;">Checkout &rarr;</a>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    overlay.addEventListener('click', closeCart);
    drawer.querySelector('#dnCartClose').addEventListener('click', closeCart);
  }

  function openCart() {
    ensureDrawer();
    renderDrawer();
    document.getElementById('dnCartOverlay').style.opacity = '1';
    document.getElementById('dnCartOverlay').style.pointerEvents = 'auto';
    document.getElementById('dnCartDrawer').style.transform = 'translateX(0)';
  }

  function closeCart() {
    var overlay = document.getElementById('dnCartOverlay');
    var drawer = document.getElementById('dnCartDrawer');
    if (!overlay || !drawer) return;
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    drawer.style.transform = 'translateX(100%)';
  }

  function renderDrawer() {
    var itemsEl = document.getElementById('dnCartItems');
    var totalEl = document.getElementById('dnCartTotal');
    if (!itemsEl || !totalEl) return;

    var cart = getCart();
    if (!cart.length) {
      itemsEl.innerHTML = '<p style="font-style:italic;color:#6B5A46;text-align:center;margin-top:2rem;">Your bag is empty.</p>';
    } else {
      itemsEl.innerHTML = cart.map(function (item, i) {
        return '' +
          '<div style="display:flex;justify-content:space-between;gap:0.75rem;padding:0.9rem 0;border-bottom:1px solid #C8BFA8;">' +
            '<div style="flex:1;">' +
              '<div style="font-weight:700;font-size:0.9rem;">' + item.name + '</div>' +
              '<div style="font-size:0.75rem;color:#6B5A46;font-style:italic;margin-bottom:0.5rem;">' + (item.size ? 'Size ' + item.size : '') + '</div>' +
              '<div style="display:flex;align-items:center;gap:0.5rem;">' +
                '<button class="dn-qty-btn" data-index="' + i + '" data-delta="-1" style="width:22px;height:22px;border:1px solid #3B2A1A;background:none;cursor:pointer;font-size:0.8rem;">-</button>' +
                '<span style="font-size:0.8rem;min-width:1.2em;text-align:center;">' + (item.qty || 1) + '</span>' +
                '<button class="dn-qty-btn" data-index="' + i + '" data-delta="1" style="width:22px;height:22px;border:1px solid #3B2A1A;background:none;cursor:pointer;font-size:0.8rem;">+</button>' +
              '</div>' +
            '</div>' +
            '<div style="text-align:right;">' +
              '<div style="font-weight:700;color:#B5522A;">' + money(item.price * (item.qty || 1)) + '</div>' +
              '<button class="dn-remove-btn" data-index="' + i + '" style="margin-top:0.6rem;background:none;border:none;color:#C8BFA8;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.08em;cursor:pointer;">Remove</button>' +
            '</div>' +
          '</div>';
      }).join('');

      itemsEl.querySelectorAll('.dn-qty-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var i = parseInt(btn.getAttribute('data-index'), 10);
          var delta = parseInt(btn.getAttribute('data-delta'), 10);
          var current = getCart()[i];
          setQty(i, (current.qty || 1) + delta);
        });
      });
      itemsEl.querySelectorAll('.dn-remove-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          removeFromCart(parseInt(btn.getAttribute('data-index'), 10));
        });
      });
    }

    totalEl.textContent = money(cartTotal(cart));
  }

  document.addEventListener('DOMContentLoaded', function () {
    var style = document.createElement('style');
    style.textContent = '.bag-pulse{animation:dnBagPulse 0.5s cubic-bezier(.36,.07,.19,1);}' +
      '@keyframes dnBagPulse{0%{transform:scale(1);}30%{transform:scale(1.18);}100%{transform:scale(1);}}';
    document.head.appendChild(style);

    ensureDrawer();
    updateBagBadge();

    document.querySelectorAll('.nav-cart').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        openCart();
      });
    });

    document.querySelectorAll('[data-add-to-bag]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var card = btn.closest('[data-item]');
        if (!card) return;
        addToCart(itemFromCard(card));
        flyToCart(btn);
        toast('Added to bag ✦ ' + (card.getAttribute('data-name') || ''));
      });
    });

    document.querySelectorAll('[data-buy-now]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var card = btn.closest('[data-item]');
        if (!card) return;
        buyNow(itemFromCard(card));
      });
    });
  });

  window.dnCart = {
    getCart: getCart,
    saveCart: saveCart,
    addToCart: addToCart,
    buyNow: buyNow,
    setQty: setQty,
    removeFromCart: removeFromCart,
    clearCart: clearCart,
    cartTotal: cartTotal,
    itemCount: itemCount,
    updateBagBadge: updateBagBadge,
    openCart: openCart,
    closeCart: closeCart,
    money: money
  };
})();
