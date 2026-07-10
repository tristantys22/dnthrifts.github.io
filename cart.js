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
  }

  function addToCart(item) {
    var cart = getCart();
    cart.push(item);
    saveCart(cart);
    return cart;
  }

  function buyNow(item) {
    saveCart([item]);
    window.location.href = 'buy.html';
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

  function cartTotal(cart) {
    return (cart || getCart()).reduce(function (sum, item) {
      return sum + (parseFloat(item.price) || 0);
    }, 0);
  }

  function updateBagBadge() {
    var count = getCart().length;
    document.querySelectorAll('.nav-cart').forEach(function (btn) {
      btn.textContent = 'Bag (' + count + ')';
    });
  }

  function itemFromCard(card) {
    return {
      name: card.getAttribute('data-name') || 'Item',
      price: parseFloat(card.getAttribute('data-price')) || 0,
      size: card.getAttribute('data-size') || ''
    };
  }

  document.addEventListener('DOMContentLoaded', function () {
    updateBagBadge();

    document.querySelectorAll('.nav-cart').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.location.href = 'buy.html';
      });
    });

    document.querySelectorAll('[data-add-to-bag]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var card = btn.closest('[data-item]');
        if (!card) return;
        addToCart(itemFromCard(card));
        var original = btn.textContent;
        btn.textContent = 'Added ✓';
        btn.disabled = true;
        setTimeout(function () {
          btn.textContent = original;
          btn.disabled = false;
        }, 1100);
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
    removeFromCart: removeFromCart,
    clearCart: clearCart,
    cartTotal: cartTotal,
    updateBagBadge: updateBagBadge
  };
})();
