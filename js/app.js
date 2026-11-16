const productCards = Array.from(document.querySelectorAll(".card[data-id]"));
const productGrid = document.querySelector("#product-grid");
const emptyState = document.querySelector("#empty-state");
const resultCount = document.querySelector("#result-count");
const searchInput = document.querySelector("#search-input");
const searchClear = document.querySelector(".search-clear");
const suggestions = document.querySelector("#search-suggestions");
const filterControls = {
  category: document.querySelector("#category-filter"),
  size: document.querySelector("#size-filter"),
  material: document.querySelector("#material-filter"),
  color: document.querySelector("#color-filter")
};
const productDialog = document.querySelector("#product-dialog");
const detailContent = document.querySelector("#detail-content");
const cartDialog = document.querySelector("#cart-dialog");
const cartContent = document.querySelector("#cart-content");
const cartCount = document.querySelector("#cart-count");
const checkoutDialog = document.querySelector("#checkout-dialog");
const checkoutForm = document.querySelector("#checkout-form");
const checkoutSummary = document.querySelector("#checkout-summary");
const orderDialog = document.querySelector("#order-dialog");
const orderContent = document.querySelector("#order-content");
const notifyDialog = document.querySelector("#notify-dialog");
const toast = document.querySelector("#toast");

const productDetails = {
  "non-may": {
    description: "Nón dáng bucket tông nâu cát, điểm viền vải sáng và hoa cúc nhỏ. Giá hiển thị không thay đổi theo size.",
    material: "Sợi cói",
    color: "Nâu cát",
    guide: "hat"
  },
  "tui-rut": {
    description: "Túi rút mini màu đỏ dâu với họa tiết chấm vàng, phù hợp để đựng những món đồ nhỏ.",
    material: "Cotton",
    color: "Đỏ dâu",
    guide: "none"
  },
  "hop-but": {
    description: "Hộp bút vải dáng baguette màu kem, có khóa kéo đỏ và ngăn phụ.",
    material: "Canvas",
    color: "Kem",
    guide: "none"
  },
  "charm-may": {
    description: "Charm hình đám mây mềm mại với gương mặt vui vẻ, có thể treo lên túi.",
    material: "Vải nỉ",
    color: "Trắng",
    guide: "none"
  },
  "dep-chieu": {
    description: "Dép chiếu màu tím oải hương, quai sáng màu. Tất cả size đang tạm hết; bạn có thể đăng ký nhận thông báo.",
    material: "Chiếu",
    color: "Tím oải hương",
    guide: "shoe"
  },
  headband: {
    description: "Băng đô vải màu hồng đào với điểm nhấn nơ đỏ, thiết kế freesize.",
    material: "Vải",
    color: "Hồng đào",
    guide: "none"
  }
};

const cart = new Map();
let activeOrder = null;
let toastTimer;

function normalizeText(value) {
  return value
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function formatPrice(value) {
  return `${Number(value).toLocaleString("vi-VN")}đ`;
}

function getCardById(id) {
  return productCards.find((card) => card.dataset.id === id);
}

function matchesSearch(card, query) {
  if (!query) return true;
  const details = productDetails[card.dataset.id];
  const searchableText = [
    card.dataset.name,
    card.querySelector(".card-category").textContent,
    details.material,
    details.color
  ].join(" ");
  return normalizeText(searchableText).includes(normalizeText(query));
}

function matchesFilters(card) {
  const selected = {
    category: filterControls.category.value,
    size: filterControls.size.value,
    material: filterControls.material.value,
    color: filterControls.color.value
  };
  const availableSizes = card.dataset.size.split(",");
  return (selected.category === "all" || card.dataset.category === selected.category)
    && (selected.size === "all" || availableSizes.includes(selected.size))
    && (selected.material === "all" || card.dataset.material === selected.material)
    && (selected.color === "all" || card.dataset.color === selected.color);
}

function updateProducts() {
  const query = searchInput.value.trim();
  let visibleCount = 0;
  productCards.forEach((card) => {
    const isVisible = matchesFilters(card) && matchesSearch(card, query);
    card.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });
  resultCount.textContent = `${visibleCount} sản phẩm`;
  productGrid.hidden = visibleCount === 0;
  emptyState.hidden = visibleCount !== 0;
  searchClear.hidden = query.length === 0;
  updateSuggestions(query);
}

function closeSuggestions() {
  suggestions.hidden = true;
  suggestions.replaceChildren();
  searchInput.setAttribute("aria-expanded", "false");
}

function updateSuggestions(query) {
  suggestions.replaceChildren();
  if (!query) {
    closeSuggestions();
    return;
  }

  const matchingProducts = productCards.filter((card) => matchesSearch(card, query)).slice(0, 5);
  if (matchingProducts.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "suggestion-empty";
    emptyItem.textContent = "Không có gợi ý phù hợp";
    suggestions.append(emptyItem);
  } else {
    matchingProducts.forEach((card) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "option");
      button.dataset.suggestion = card.dataset.id;
      const name = document.createElement("span");
      name.className = "suggestion-name";
      name.textContent = card.dataset.name;
      const price = document.createElement("span");
      price.className = "suggestion-price";
      price.textContent = formatPrice(card.dataset.price);
      button.append(name, price);
      item.append(button);
      suggestions.append(item);
    });
  }

  suggestions.hidden = false;
  searchInput.setAttribute("aria-expanded", "true");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
}

function getSizes(card) {
  return card.dataset.size.split(",");
}

function openDetails(id) {
  const card = getCardById(id);
  if (!card) return;

  const details = productDetails[id];
  const sizes = getSizes(card);
  const available = card.dataset.available.split(",").filter(Boolean);
  const sizeOptions = sizes.map((size) => {
    const isAvailable = available.includes(size);
    const isUnavailable = !isAvailable;
    return `<label class="size-option${isUnavailable ? " is-unavailable" : ""}">
      <input type="radio" name="detail-size" value="${size}"${isAvailable ? "" : " disabled"}>
      <span>${size === "freesize" ? "Freesize" : size}</span>
    </label>`;
  }).join("");
  const sizeGuide = details.guide === "hat"
    ? `<button class="size-guide" type="button" data-size-guide>Mở bảng hướng dẫn size</button>
       <table class="size-table" data-size-table hidden>
         <thead><tr><th>Size</th><th>Vòng đầu tham khảo</th><th>Tình trạng</th></tr></thead>
         <tbody><tr><td>S</td><td>54–56 cm</td><td>Còn hàng</td></tr><tr><td>M</td><td>57–59 cm</td><td>Tạm hết</td></tr></tbody>
       </table>`
    : details.guide === "shoe"
      ? `<button class="size-guide" type="button" data-size-guide>Mở bảng hướng dẫn size</button>
         <table class="size-table" data-size-table hidden>
           <thead><tr><th>Size</th><th>Chiều dài chân tham khảo</th><th>Tình trạng</th></tr></thead>
           <tbody><tr><td>36</td><td>22–23 cm</td><td>Tạm hết</td></tr><tr><td>38</td><td>23–24 cm</td><td>Tạm hết</td></tr><tr><td>40</td><td>24–25 cm</td><td>Tạm hết</td></tr></tbody>
         </table>`
      : "";

  detailContent.innerHTML = `
    <img class="detail-image" src="${card.querySelector("img").getAttribute("src")}" alt="${card.querySelector("img").alt}">
    <div class="detail-copy">
      <p class="eyebrow">${card.querySelector(".card-category").textContent}</p>
      <h2 id="detail-title">${card.dataset.name}</h2>
      <p>${details.description}</p>
      <p class="price detail-price"><span class="price-now">${formatPrice(card.dataset.price)}</span></p>
      <div class="detail-attributes">
        <span><strong>Chất liệu:</strong> ${details.material}</span>
        <span><strong>Màu sắc:</strong> ${details.color}</span>
      </div>
      <fieldset class="size-picker">
        <legend>${sizes[0] === "freesize" ? "Kích thước" : "Chọn size"}</legend>
        <div class="size-options">${sizeOptions}</div>
      </fieldset>
      ${sizeGuide}
      <button class="btn ${available.length ? "btn-primary" : "btn-secondary"}" type="button" data-detail-action="${available.length ? "add" : "notify"}" data-product-id="${id}">
        ${available.length ? "Thêm vào túi" : "Báo khi có hàng"}
      </button>
      <p class="detail-status" role="status"></p>
    </div>`;
  productDialog.showModal();
}

function addToCart(id, size) {
  const card = getCardById(id);
  if (!card || !size || !card.dataset.available.split(",").includes(size)) return;
  const key = `${id}:${size}`;
  const existing = cart.get(key);
  cart.set(key, {
    id,
    size,
    quantity: existing ? existing.quantity + 1 : 1
  });
  updateCart();
  showToast(`${card.dataset.name} đã được thêm vào túi.`);
}

function updateCart() {
  const entries = Array.from(cart.entries());
  const quantity = entries.reduce((sum, [, item]) => sum + item.quantity, 0);
  cartCount.textContent = quantity;
  cartCount.setAttribute("aria-label", `${quantity} sản phẩm`);

  if (entries.length === 0) {
    cartContent.innerHTML = `<p class="cart-empty">Giỏ hàng đang trống. Chọn một món đồ bạn thích nhé.</p>`;
    return;
  }

  const total = getCartTotal();
  const listItems = entries.map(([key, item]) => {
    const card = getCardById(item.id);
    const lineTotal = Number(card.dataset.price) * item.quantity;
    return `<article class="cart-item">
      <img src="${card.querySelector("img").getAttribute("src")}" alt="">
      <div><h3>${card.dataset.name}</h3><p>${item.size === "freesize" ? "Freesize" : `Size ${item.size}`} · SL ${item.quantity}</p></div>
      <span class="cart-item-price">${formatPrice(lineTotal)} <button type="button" class="remove-cart-item" data-remove="${key}" aria-label="Xóa ${card.dataset.name} khỏi giỏ">×</button></span>
    </article>`;
  }).join("");
  cartContent.innerHTML = `
    <div class="cart-list">${listItems}</div>
    <div class="cart-total"><span>Tạm tính</span><strong>${formatPrice(total)}</strong></div>
    <p class="cart-note">Kiểm tra lại sản phẩm, size và số lượng trước khi nhập thông tin nhận hàng.</p>
    <button class="btn btn-primary checkout-start" type="button">Tiến hành đặt hàng</button>`;
}

function getCartTotal() {
  return Array.from(cart.values()).reduce((total, item) => {
    const card = getCardById(item.id);
    return total + Number(card.dataset.price) * item.quantity;
  }, 0);
}

function updateCheckoutSummary() {
  const quantity = Array.from(cart.values()).reduce((sum, item) => sum + item.quantity, 0);
  checkoutSummary.replaceChildren();
  const items = document.createElement("span");
  items.textContent = `${quantity} sản phẩm`;
  const total = document.createElement("strong");
  total.textContent = formatPrice(getCartTotal());
  checkoutSummary.append(items, total);
}

function renderOrder(order) {
  const paymentStatusLabels = {
    pending: "Chờ thanh toán (mô phỏng)",
    paid: "Đã thanh toán (mô phỏng)",
    failed: "Thanh toán thất bại (mô phỏng)"
  };
  orderContent.innerHTML = `
    <p class="order-id">Mã đơn: <strong data-order-id></strong></p>
    <div class="order-details">
      <span data-order-customer></span>
      <span data-order-phone></span>
      <span data-order-email></span>
      <span data-order-address></span>
      <span data-order-payment></span>
    </div>
    <div class="order-lines" data-order-lines></div>
    <div class="order-total"><span>Tạm tính sản phẩm (chưa gồm vận chuyển)</span><strong data-order-total></strong></div>
    <p class="payment-status" data-order-status role="status"></p>
    <p class="payment-simulation-note" data-payment-note></p>
    <div class="payment-actions">
      <button class="btn btn-primary" type="button" data-simulate-payment="paid"></button>
      <button class="btn btn-secondary" type="button" data-simulate-payment="failed">Mô phỏng giao dịch thất bại</button>
    </div>
    <button class="btn btn-secondary order-close" type="button" data-close-order>Đóng</button>`;

  orderContent.querySelector("[data-order-id]").textContent = order.id;
  orderContent.querySelector("[data-order-customer]").textContent = `Người nhận: ${order.customer.name}`;
  orderContent.querySelector("[data-order-phone]").textContent = `Điện thoại: ${order.customer.phone}`;
  const emailLine = orderContent.querySelector("[data-order-email]");
  emailLine.hidden = !order.customer.email;
  emailLine.textContent = order.customer.email ? `Email: ${order.customer.email}` : "";
  orderContent.querySelector("[data-order-address]").textContent = `Địa chỉ: ${order.customer.address}`;
  orderContent.querySelector("[data-order-payment]").textContent = `Thanh toán: ${order.paymentLabel}`;
  orderContent.querySelector("[data-order-total]").textContent = formatPrice(order.total);

  const lines = orderContent.querySelector("[data-order-lines]");
  order.items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "order-line";
    const label = document.createElement("span");
    label.textContent = `${item.name} · ${item.size === "freesize" ? "Freesize" : `Size ${item.size}`} × ${item.quantity}`;
    const amount = document.createElement("strong");
    amount.textContent = formatPrice(item.unitPrice * item.quantity);
    row.append(label, amount);
    lines.append(row);
  });

  const status = orderContent.querySelector("[data-order-status]");
  status.textContent = paymentStatusLabels[order.status];
  status.classList.toggle("is-success", order.status === "paid");
  status.classList.toggle("is-failed", order.status === "failed");
  orderContent.querySelector("[data-payment-note]").textContent = order.paymentMethod === "vietqr"
    ? "Không tạo mã QR hoặc xác nhận giao dịch ngân hàng thật."
    : "Không chuyển hướng tới VNPay/MoMo; trạng thái chỉ được mô phỏng trong trang.";
  const paidButton = orderContent.querySelector('[data-simulate-payment="paid"]');
  paidButton.textContent = order.paymentMethod === "vietqr"
    ? "Mô phỏng đã chuyển khoản"
    : "Mô phỏng thanh toán thành công";
  orderContent.querySelector('[data-simulate-payment="failed"]').hidden = order.status === "paid";
  paidButton.hidden = order.status === "paid";
}

function createOrder(formData) {
  const paymentMethod = formData.get("payment-method");
  const paymentLabels = {
    vietqr: "VietQR / chuyển khoản (mô phỏng)",
    vnpay: "VNPay (mô phỏng)",
    momo: "MoMo (mô phỏng)"
  };
  const orderNumber = Math.random().toString(36).slice(2, 7).toUpperCase();
  const orderDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const order = {
    id: `SCI-${orderDate}-${orderNumber}`,
    customer: {
      name: formData.get("customer-name").trim(),
      phone: formData.get("customer-phone").trim(),
      email: formData.get("customer-email").trim(),
      address: formData.get("shipping-address").trim()
    },
    paymentMethod,
    paymentLabel: paymentLabels[paymentMethod],
    items: Array.from(cart.values()).map((item) => {
      const card = getCardById(item.id);
      return {
        id: item.id,
        name: card.dataset.name,
        size: item.size,
        quantity: item.quantity,
        unitPrice: Number(card.dataset.price)
      };
    }),
    total: getCartTotal(),
    status: "pending",
    createdAt: new Date().toISOString()
  };

  return order;
}

function openNotifyDialog(id) {
  const card = getCardById(id);
  if (!card) return;
  document.querySelector("#notify-product-name").textContent = card.dataset.name;
  document.querySelector("#notify-success").hidden = true;
  document.querySelector("#notify-form").hidden = false;
  document.querySelector("#notify-form").reset();
  notifyDialog.showModal();
}

function resetFilters() {
  document.querySelector("#filter-form").reset();
  searchInput.value = "";
  updateProducts();
}

document.querySelector("#filter-form").addEventListener("change", updateProducts);
document.querySelector("#filter-form").addEventListener("reset", () => window.setTimeout(updateProducts, 0));
searchInput.addEventListener("input", updateProducts);
searchInput.addEventListener("focus", () => updateSuggestions(searchInput.value.trim()));
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeSuggestions();
  if (event.key === "Enter") {
    event.preventDefault();
    closeSuggestions();
    document.querySelector("#products").scrollIntoView({ behavior: "smooth" });
  }
});
searchInput.form.addEventListener("submit", (event) => {
  event.preventDefault();
  closeSuggestions();
  document.querySelector("#products").scrollIntoView({ behavior: "smooth" });
});
searchClear.addEventListener("click", () => {
  searchInput.value = "";
  updateProducts();
  searchInput.focus();
});
suggestions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-suggestion]");
  if (!button) return;
  searchInput.value = getCardById(button.dataset.suggestion).dataset.name;
  closeSuggestions();
  updateProducts();
  document.querySelector("#products").scrollIntoView({ behavior: "smooth" });
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".search-form")) closeSuggestions();
});

document.querySelectorAll("[data-category-link]").forEach((link) => {
  link.addEventListener("click", () => {
    filterControls.category.value = link.dataset.categoryLink;
    updateProducts();
    document.querySelectorAll("[data-category-link]").forEach((item) => item.removeAttribute("aria-current"));
    link.setAttribute("aria-current", "page");
  });
});

document.querySelector("#product-grid").addEventListener("click", (event) => {
  const detailsButton = event.target.closest("[data-details]");
  if (detailsButton) {
    openDetails(detailsButton.dataset.details);
    return;
  }
  const addButton = event.target.closest("[data-add]");
  if (addButton) {
    const card = getCardById(addButton.dataset.add);
    if (card.dataset.available === "freesize") {
      addToCart(card.dataset.id, "freesize");
    } else {
      openDetails(card.dataset.id);
    }
    return;
  }
  const notifyButton = event.target.closest("[data-notify]");
  if (notifyButton) openNotifyDialog(notifyButton.dataset.notify);
});

detailContent.addEventListener("click", (event) => {
  const guideButton = event.target.closest("[data-size-guide]");
  if (guideButton) {
    const table = detailContent.querySelector("[data-size-table]");
    table.hidden = !table.hidden;
    guideButton.textContent = table.hidden ? "Mở bảng hướng dẫn size" : "Đóng bảng hướng dẫn size";
    return;
  }

  const action = event.target.closest("[data-detail-action]");
  if (!action) return;
  if (action.dataset.detailAction === "notify") {
    const id = action.dataset.productId;
    productDialog.close();
    openNotifyDialog(id);
    return;
  }

  const selectedSize = detailContent.querySelector('input[name="detail-size"]:checked');
  const status = detailContent.querySelector(".detail-status");
  if (!selectedSize) {
    status.textContent = "Chọn size còn hàng để tiếp tục.";
    return;
  }
  addToCart(action.dataset.productId, selectedSize.value);
  productDialog.close();
});

document.querySelector("#open-cart").addEventListener("click", () => {
  updateCart();
  cartDialog.showModal();
});
cartContent.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) {
    cart.delete(removeButton.dataset.remove);
    updateCart();
    return;
  }
  const checkoutButton = event.target.closest(".checkout-start");
  if (checkoutButton) {
    updateCheckoutSummary();
    cartDialog.close();
    checkoutDialog.showModal();
  }
});

checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (cart.size === 0) {
    checkoutDialog.close();
    showToast("Giỏ hàng trống, chưa thể tạo đơn.");
    return;
  }

  activeOrder = createOrder(new FormData(checkoutForm));
  cart.clear();
  updateCart();
  checkoutForm.reset();
  checkoutDialog.close();
  renderOrder(activeOrder);
  orderDialog.showModal();
});

orderContent.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-order]")) {
    orderDialog.close();
    return;
  }
  const paymentButton = event.target.closest("[data-simulate-payment]");
  if (!paymentButton || !activeOrder || activeOrder.status === "paid") return;
  activeOrder.status = paymentButton.dataset.simulatePayment;
  renderOrder(activeOrder);
});

document.querySelector("#notify-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const productName = document.querySelector("#notify-product-name").textContent;
  document.querySelector("#notify-form").hidden = true;
  const success = document.querySelector("#notify-success");
  success.textContent = `Đã ghi nhận yêu cầu nhận tin cho ${productName}. Bản demo chưa gửi email thật.`;
  success.hidden = false;
});

document.querySelector("#empty-reset").addEventListener("click", resetFilters);
updateProducts();
updateCart();
