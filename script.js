const SUPABASE_URL =
  "https://fpwucoinxomhvtqrpabw.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_F8ON8ZRtSct2f44fgEuNHw_yVsaFyjj";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let currentUser = null;
let currentConversation = null;
let allProducts = [];
let selectedLocation = "";

const $ = id => document.getElementById(id);


/* ================= HELPERS ================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toast(message) {
  const el = $("toast");

  if (!el) return;

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    el.classList.remove("show");
  }, 3000);
}


/* ================= PAGE NAVIGATION ================= */

function showPage(page) {

  document.querySelectorAll(".page").forEach(section => {
    section.classList.remove("active-page");
  });

  const target = $(page + "Page");

  if (target) {
    target.classList.add("active-page");
  }

  document.querySelectorAll(
    ".bottom-nav-item, .bottom-add, .nav-link, .side-link"
  ).forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  closeMenu();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  if (page === "home") {
    loadProducts();
  }

  if (page === "search") {
    renderSearch();
  }

  if (page === "favorites") {
    loadFavorites();
  }

  if (page === "chat") {
    loadConversations();
  }

  if (page === "account") {
    updateAccountUI();
  }
}


document.addEventListener("click", event => {

  const button =
    event.target.closest("[data-page]");

  if (!button) return;

  event.preventDefault();

  showPage(button.dataset.page);
});


/* ================= MENU ================= */

function openMenu() {

  $("sideMenu")?.classList.add("open");
  $("menuOverlay")?.classList.add("show");
}

function closeMenu() {

  $("sideMenu")?.classList.remove("open");
  $("menuOverlay")?.classList.remove("show");
}

$("menuBtn")?.addEventListener(
  "click",
  openMenu
);

$("closeMenuBtn")?.addEventListener(
  "click",
  closeMenu
);

$("menuOverlay")?.addEventListener(
  "click",
  closeMenu
);


/* ================= LOCATION ================= */

function openLocationModal() {

  $("locationModal")?.classList.add("show");
}

function closeLocationModal() {

  $("locationModal")?.classList.remove("show");
}

$("locationBtn")?.addEventListener(
  "click",
  openLocationModal
);

$("heroLocationBtn")?.addEventListener(
  "click",
  openLocationModal
);

$("settingsLocationBtn")?.addEventListener(
  "click",
  openLocationModal
);

$("closeLocationModal")?.addEventListener(
  "click",
  closeLocationModal
);


document.querySelectorAll(
  "#locationList button"
).forEach(button => {

  button.addEventListener("click", () => {

    selectedLocation =
      button.dataset.location || "";

    const label =
      selectedLocation || "همه افغانستان";

    if ($("selectedLocation"))
      $("selectedLocation").textContent = label;

    if ($("heroLocation"))
      $("heroLocation").textContent = label;

    if ($("settingsLocation"))
      $("settingsLocation").textContent = label;

    if ($("cityFilter"))
      $("cityFilter").value = selectedLocation;

    localStorage.setItem(
      "bazaarLocation",
      selectedLocation
    );

    closeLocationModal();

    renderSearch();
  });
});


$("locationSearch")?.addEventListener(
  "input",
  event => {

    const text =
      event.target.value.trim().toLowerCase();

    document.querySelectorAll(
      "#locationList button"
    ).forEach(button => {

      const name =
        button.textContent.toLowerCase();

      button.style.display =
        name.includes(text)
          ? ""
          : "none";
    });
  }
);


/* ================= PRODUCTS ================= */

async function loadProducts() {

  const { data, error } =
    await db
      .from("products")
      .select("*")
      .eq("status", "active")
      .order("created_at", {
        ascending: false
      });

  if (error) {

    console.error(error);

    toast("خطا در دریافت آگهی‌ها");

    return;
  }

  allProducts = data || [];

  renderHomeProducts();
  renderSearch();
}


function renderHomeProducts() {

  const latest =
    allProducts.slice(0, 12);

  const featured =
    allProducts.slice(0, 4);

  renderProducts(
    latest,
    $("homeProducts")
  );

  renderProducts(
    featured,
    $("featuredProducts")
  );
}


function renderProducts(
  products,
  container
) {

  if (!container) return;

  if (!products.length) {

    container.innerHTML = `
      <div class="muted">
        هنوز آگهی‌ای پیدا نشد.
      </div>
    `;

    return;
  }

  container.innerHTML =
    products.map(product => {

      const image =
        product.image_url
          ? `
            <img
              src="${escapeHtml(product.image_url)}"
              alt="${escapeHtml(product.title)}"
              loading="lazy">
          `
          : `
            <div class="no-image">
              🛍️
            </div>
          `;

      const price =
        Number(product.price || 0)
          .toLocaleString("fa-AF");

      return `
        <article
          class="product-card">

          ${image}

          <div class="product-info">

            <h3>
              ${escapeHtml(product.title)}
            </h3>

            <strong>
              ${price} ؋
            </strong>

            <p>
              📍 ${escapeHtml(product.city || "افغانستان")}
            </p>

            <small>
              ${escapeHtml(product.category || "سایر")}
            </small>

            ${
              product.description
                ? `
                  <p>
                    ${escapeHtml(
                      product.description
                    )}
                  </p>
                `
                : ""
            }

            <div class="card-actions">

              <button
                class="secondary favorite-btn"
                data-product="${product.id}"
                type="button">

                ⭐ ذخیره

              </button>

              ${
                currentUser &&
                currentUser.id !== product.user_id
                  ? `
                    <button
                      class="primary chat-btn"
                      data-product="${product.id}"
                      data-seller="${product.user_id}"
                      type="button">

                      💬 چت

                    </button>
                  `
                  : ""
              }

              ${
                currentUser &&
                currentUser.id === product.user_id
                  ? `
                    <button
                      class="danger delete-product"
                      data-product="${product.id}"
                      type="button">

                      حذف آگهی

                    </button>
                  `
                  : ""
              }

            </div>

          </div>

        </article>
      `;

    }).join("");
}


/* ================= SEARCH ================= */

function renderSearch() {

  const container =
    $("searchProducts");

  if (!container) return;

  const text =
    ($("searchInput")?.value || "")
      .trim()
      .toLowerCase();

  const category =
    $("categoryFilter")?.value || "";

  const city =
    $("cityFilter")?.value ||
    selectedLocation ||
    "";

  const min =
    Number($("minPrice")?.value || 0);

  const maxValue =
    $("maxPrice")?.value;

  const max =
    maxValue === ""
      ? Infinity
      : Number(maxValue);

  const sort =
    $("sortFilter")?.value ||
    "newest";


  let filtered =
    allProducts.filter(product => {

      const title =
        String(product.title || "")
          .toLowerCase();

      const description =
        String(product.description || "")
          .toLowerCase();

      const matchText =
        !text ||
        title.includes(text) ||
        description.includes(text);

      const matchCategory =
        !category ||
        product.category === category;

      const matchCity =
        !city ||
        product.city === city;

      const price =
        Number(product.price || 0);

      const matchPrice =
        price >= min &&
        price <= max;

      return (
        matchText &&
        matchCategory &&
        matchCity &&
        matchPrice
      );
    });


  if (sort === "cheap") {

    filtered.sort(
      (a,b) =>
        Number(a.price || 0) -
        Number(b.price || 0)
    );

  } else if (sort === "expensive") {

    filtered.sort(
      (a,b) =>
        Number(b.price || 0) -
        Number(a.price || 0)
    );

  } else if (sort === "oldest") {

    filtered.sort(
      (a,b) =>
        new Date(a.created_at) -
        new Date(b.created_at)
    );

  } else {

    filtered.sort(
      (a,b) =>
        new Date(b.created_at) -
        new Date(a.created_at)
    );
  }


  renderProducts(
    filtered,
    container
  );


  if ($("resultsCount")) {

    $("resultsCount").textContent =
      `${filtered.length.toLocaleString("fa-AF")} آگهی`;
  }
}


[
  "searchInput",
  "categoryFilter",
  "cityFilter",
  "minPrice",
  "maxPrice",
  "sortFilter"
].forEach(id => {

  $(id)?.addEventListener(
    "input",
    renderSearch
  );

  $(id)?.addEventListener(
    "change",
    renderSearch
  );
});


$("clearSearchBtn")?.addEventListener(
  "click",
  () => {

    if ($("searchInput"))
      $("searchInput").value = "";

    renderSearch();
  }
);


$("resetFiltersBtn")?.addEventListener(
  "click",
  () => {

    [
      "searchInput",
      "minPrice",
      "maxPrice"
    ].forEach(id => {

      if ($(id))
        $(id).value = "";
    });

    if ($("categoryFilter"))
      $("categoryFilter").value = "";

    if ($("cityFilter"))
      $("cityFilter").value = "";

    if ($("sortFilter"))
      $("sortFilter").value = "newest";

    selectedLocation = "";

    renderSearch();
  }
);


/* ================= HOME SEARCH ================= */

$("homeSearchBtn")?.addEventListener(
  "click",
  () => {

    const value =
      $("homeSearchInput")?.value || "";

    if ($("searchInput"))
      $("searchInput").value = value;

    showPage("search");

    renderSearch();
  }
);


$("homeSearchInput")?.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {

      $("homeSearchBtn")?.click();
    }
  }
);


/* ================= CATEGORIES ================= */

document.querySelectorAll(
  ".category-card"
).forEach(button => {

  button.addEventListener(
    "click",
    () => {

      const category =
        button.dataset.category;

      if ($("categoryFilter"))
        $("categoryFilter").value =
          category;

      showPage("search");

      renderSearch();
    }
  );
});


/* ================= FAVORITES ================= */

async function toggleFavorite(productId) {

  if (!currentUser) {

    toast(
      "برای ذخیره آگهی اول وارد حساب شو."
    );

    showPage("account");

    return;
  }


  const { data } =
    await db
      .from("favorites")
      .select("product_id")
      .eq("user_id", currentUser.id)
      .eq("product_id", productId)
      .maybeSingle();


  if (data) {

    await db
      .from("favorites")
      .delete()
      .eq("user_id", currentUser.id)
      .eq("product_id", productId);

    toast("از علاقه‌مندی حذف شد.");

  } else {

    const { error } =
      await db
        .from("favorites")
        .insert({
          user_id: currentUser.id,
          product_id: productId
        });

    if (error) {

      console.error(error);

      toast("ذخیره آگهی ناموفق بود");

      return;
    }

    toast("به علاقه‌مندی اضافه شد.");
  }
}


async function loadFavorites() {

  const container =
    $("favoriteProducts");

  if (!container) return;


  if (!currentUser) {

    container.innerHTML = `
      <p class="muted">
        برای دیدن علاقه‌مندی‌ها وارد حساب شو.
      </p>
    `;

    return;
  }


  const { data, error } =
    await db
      .from("favorites")
      .select(
        "product_id, products(*)"
      )
      .eq(
        "user_id",
        currentUser.id
      );


  if (error) {

    console.error(error);

    toast("خطا در دریافت علاقه‌مندی‌ها");

    return;
  }


  const products =
    (data || [])
      .map(item => item.products)
      .filter(Boolean);


  renderProducts(
    products,
    container
  );
}


/* ================= DELETE PRODUCT ================= */

async function deleteProduct(
  productId
) {

  if (!currentUser) return;


  const confirmed =
    confirm("آیا از حذف این آگهی مطمئن هستی؟");

  if (!confirmed) return;


  const { error } =
    await db
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("user_id", currentUser.id);


  if (error) {

    console.error(error);

    toast("حذف آگهی ناموفق بود");

    return;
  }


  toast("آگهی حذف شد.");

  await loadProducts();
}


/* ================= ADD PRODUCT ================= */

$("productForm")?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    if (!currentUser) {

      toast(
        "برای ثبت آگهی اول وارد حساب شو."
      );

      showPage("account");

      return;
    }


    const product = {

      user_id: currentUser.id,

      title:
        $("productTitle").value.trim(),

      price:
        Number(
          $("productPrice").value
        ),

      category:
        $("productCategory").value,

      city:
        $("productCity").value,

      description:
        $("productDescription").value.trim(),

      image_url:
        $("productImage").value.trim() ||
        null,

      status:
        "active"
    };


    const { error } =
      await db
        .from("products")
        .insert(product);


    if (error) {

      console.error(error);

      toast(
        "ثبت آگهی ناموفق بود."
      );

      return;
    }


    $("productForm").reset();

    toast(
      "آگهی با موفقیت ثبت شد 🎉"
    );

    await loadProducts();

    showPage("home");
  }
);


/* ================= ACCOUNT ================= */

async function updateAccountUI() {

  const status =
    $("accountStatus");

  const profileForm =
    $("profileForm");

  const logoutBtn =
    $("logoutBtn");


  if (!currentUser) {

    if (status) {

      status.innerHTML = `
        <p class="muted">
          هنوز وارد حساب نشده‌ای.
        </p>
      `;
    }

    if (profileForm)
      profileForm.hidden = true;

    if (logoutBtn)
      logoutBtn.hidden = true;

    return;
  }


  if (status) {

    status.innerHTML = `
      <p>
        وارد شده با:
        <b>
          ${escapeHtml(currentUser.email)}
        </b>
      </p>
    `;
  }


  if (profileForm)
    profileForm.hidden = false;

  if (logoutBtn)
    logoutBtn.hidden = false;


  const { data } =
    await db
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();


  if (data) {

    if ($("displayName"))
      $("displayName").value =
        data.display_name || "";

    if ($("profileCity"))
      $("profileCity").value =
        data.city || "";
  }
}


/* ================= PROFILE ================= */

$("profileForm")?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    if (!currentUser) return;


    const { error } =
      await db
        .from("profiles")
        .upsert({

          id: currentUser.id,

          display_name:
            $("displayName").value.trim() ||
            "کاربر بازارچه",

          city:
            $("profileCity").value ||
            null
        });


    if (error) {

      console.error(error);

      toast(
        "ذخیره پروفایل ناموفق بود."
      );

      return;
    }


    toast(
      "پروفایل ذخیره شد."
    );
  }
);


/* ================= AUTH LOGIN ================= */

$("authForm")?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const email =
      $("email").value.trim();

    const password =
      $("password").value;


    const { error } =
      await db.auth.signInWithPassword({

        email,
        password

      });


    if (error) {

      console.error(error);

      toast(
        "ورود ناموفق بود."
      );

      return;
    }


    toast(
      "خوش آمدی 👋"
    );
  }
);


/* ================= SIGN UP ================= */

$("signupBtn")?.addEventListener(
  "click",
  async () => {

    const email =
      $("email").value.trim();

    const password =
      $("password").value;


    if (!email) {

      toast(
        "ایمیل را وارد کن."
      );

      return;
    }


    if (password.length < 6) {

      toast(
        "رمز عبور باید حداقل ۶ حرف باشد."
      );

      return;
    }


    const { data, error } =
      await db.auth.signUp({

        email,
        password

      });


    if (error) {

      console.error(error);

      toast(
        "ثبت‌نام ناموفق بود."
      );

      return;
    }


    if (data.session) {

      toast(
        "ثبت‌نام با موفقیت انجام شد 🎉"
      );

    } else {

      toast(
        "ثبت‌نام شد. ایمیل خود را برای تأیید بررسی کن."
      );
    }
  }
);


/* ================= LOGOUT ================= */

$("logoutBtn")?.addEventListener(
  "click",
  async () => {

    await db.auth.signOut();

    currentUser = null;

    toast(
      "از حساب خارج شدی."
    );

    await updateAccountUI();

    await loadProducts();
  }
);


/* ================= RESET PASSWORD ================= */

$("resetBtn")?.addEventListener(
  "click",
  async () => {

    const email =
      $("email").value.trim();


    if (!email) {

      toast(
        "اول ایمیل خود را وارد کن."
      );

      return;
    }


    const { error } =
      await db.auth.resetPasswordForEmail(
        email,
        {
          redirectTo:
            window.location.origin +
            window.location.pathname
        }
      );


    if (error) {

      console.error(error);

      toast(
        "ارسال لینک تغییر رمز ناموفق بود."
      );

      return;
    }


    toast(
      "لینک تغییر رمز به ایمیل فرستاده شد."
    );
  }
);


/* ================= CHAT ================= */

async function startChat(
  productId,
  sellerId
) {

  if (!currentUser) {

    toast(
      "اول وارد حساب شو."
    );

    showPage("account");

    return;
  }


  if (currentUser.id === sellerId) {

    toast(
      "نمی‌توانی با خودت چت کنی."
    );

    return;
  }


  let { data: conversation } =
    await db
      .from("conversations")
      .select("*")
      .eq("product_id", productId)
      .eq("buyer_id", currentUser.id)
      .eq("seller_id", sellerId)
      .maybeSingle();


  if (!conversation) {

    const result =
      await db
        .from("conversations")
        .insert({

          product_id:
            productId,

          buyer_id:
            currentUser.id,

          seller_id:
            sellerId

        })
        .select()
        .single();


    if (result.error) {

      console.error(result.error);

      toast(
        "ساخت گفتگو ناموفق بود."
      );

      return;
    }


    conversation =
      result.data;
  }


  currentConversation =
    conversation.id;


  showPage("chat");

  await loadConversations();

  await loadMessages(
    conversation.id
  );
}


async function loadConversations() {

  const list =
    $("conversationList");

  if (!list) return;


  if (!currentUser) {

    list.innerHTML = `
      <p class="muted">
        برای دیدن گفتگوها وارد حساب شو.
      </p>
    `;

    return;
  }


  const { data, error } =
    await db
      .from("conversations")
      .select("*")
      .or(
        `buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(error);

    return;
  }


  if (!data?.length) {

    list.innerHTML = `
      <p class="muted">
        هنوز گفتگویی نداری.
      </p>
    `;

    return;
  }


  list.innerHTML =
    data.map(conversation => `

      <button
        class="conversation-item"
        data-conversation="${conversation.id}"
        type="button">

        💬 گفتگوی آگهی
        #${conversation.product_id || ""}

      </button>

    `).join("");
}


async function loadMessages(
  conversationId
) {

  currentConversation =
    conversationId;


  const { data, error } =
    await db
      .from("messages")
      .select("*")
      .eq(
        "conversation_id",
        conversationId
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(error);

    return;
  }


  const box =
    $("messages");

  if (!box) return;


  box.innerHTML =
    (data || []).map(message => {

      const mine =
        message.sender_id ===
        currentUser?.id;


      return `
        <div
          class="message ${mine ? "mine" : ""}">

          ${escapeHtml(
            message.body
          )}

        </div>
      `;

    }).join("");


  box.scrollTop =
    box.scrollHeight;


  if ($("chatHeader")) {

    $("chatHeader").textContent =
      "💬 گفتگوی بازارچه";
  }
}


$("conversationList")?.addEventListener(
  "click",
  event => {

    const item =
      event.target.closest(
        "[data-conversation]"
      );

    if (!item) return;

    loadMessages(
      Number(
        item.dataset.conversation
      )
    );
  }
);


/* ================= SEND MESSAGE ================= */

$("messageForm")?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    if (
      !currentUser ||
      !currentConversation
    ) {

      toast(
        "اول یک گفتگو را انتخاب کن."
      );

      return;
    }


    const body =
      $("messageInput")
        .value
        .trim();


    if (!body) return;


    const { error } =
      await db
        .from("messages")
        .insert({

          conversation_id:
            currentConversation,

          sender_id:
            currentUser.id,

          body

        });


    if (error) {

      console.error(error);

      toast(
        "ارسال پیام ناموفق بود."
      );

      return;
    }


    $("messageInput").value = "";

    await loadMessages(
      currentConversation
    );
  }
);


/* ================= CARD BUTTONS ================= */

document.addEventListener(
  "click",
  event => {

    const favorite =
      event.target.closest(
        ".favorite-btn"
      );

    if (favorite) {

      toggleFavorite(
        Number(
          favorite.dataset.product
        )
      );

      return;
    }


    const chat =
      event.target.closest(
        ".chat-btn"
      );

    if (chat) {

      startChat(
        Number(
          chat.dataset.product
        ),
        chat.dataset.seller
      );

      return;
    }


    const deleteButton =
      event.target.closest(
        ".delete-product"
      );

    if (deleteButton) {

      deleteProduct(
        Number(
          deleteButton.dataset.product
        )
      );
    }
  }
);


/* ================= DARK MODE ================= */

function loadDarkMode() {

  const dark =
    localStorage.getItem(
      "bazaarDark"
    ) === "1";


  document.body.classList.toggle(
    "dark",
    dark
  );


  if ($("darkToggle"))
    $("darkToggle").checked =
      dark;
}


$("darkToggle")?.addEventListener(
  "change",
  event => {

    const dark =
      event.target.checked;


    document.body.classList.toggle(
      "dark",
      dark
    );


    localStorage.setItem(
      "bazaarDark",
      dark ? "1" : "0"
    );
  }
);


/* ================= LOCATION LOAD ================= */

function loadSavedLocation() {

  selectedLocation =
    localStorage.getItem(
      "bazaarLocation"
    ) || "";


  const label =
    selectedLocation ||
    "همه افغانستان";


  if ($("selectedLocation"))
    $("selectedLocation").textContent =
      label;


  if ($("heroLocation"))
    $("heroLocation").textContent =
      label;


  if ($("settingsLocation"))
    $("settingsLocation").textContent =
      label;


  if ($("cityFilter"))
    $("cityFilter").value =
      selectedLocation;
}


/* ================= REALTIME ================= */

function setupRealtime() {

  db.channel(
    "bazaar-messages"
  )
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages"
    },
    payload => {

      if (
        currentConversation &&
        payload.new.conversation_id ===
          currentConversation
      ) {

        loadMessages(
          currentConversation
        );
      }
    }
  )
  .subscribe();
}


/* ================= INIT ================= */

async function init() {

  loadDarkMode();

  loadSavedLocation();


  const { data } =
    await db.auth.getSession();


  currentUser =
    data.session?.user || null;


  await loadProducts();

  await updateAccountUI();

  setupRealtime();


  db.auth.onAuthStateChange(
    async (_event, session) => {

      currentUser =
        session?.user || null;

      await updateAccountUI();

      await loadProducts();

      if ($("favoriteProducts")) {
        await loadFavorites();
      }
    }
  );
}


init();
