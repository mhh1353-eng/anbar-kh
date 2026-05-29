// ==================== سیستم احراز هویت ====================

// کاربر پیش‌فرض (مدیر اصلی)
const DEFAULT_USERS = [
    {
        id: 1,
        username: "admin",
        password: "admin123",
        displayName: "مدیر سیستم",
        role: "admin",
        lastLogin: null
    }
];

// بارگذاری کاربران از localStorage
function loadUsers() {
    const saved = localStorage.getItem('system_users');
    if (saved) {
        return JSON.parse(saved);
    }
    // ذخیره کاربر پیش‌فرض
    localStorage.setItem('system_users', JSON.stringify(DEFAULT_USERS));
    return [...DEFAULT_USERS];
}

// ذخیره کاربران
function saveUsers(users) {
    localStorage.setItem('system_users', JSON.stringify(users));
}

// کاربر فعلی (لاگین شده)
let currentUser = null;

// تابع لاگین
function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const token = document.getElementById('loginToken').value.trim();  // ← اضافه شد
    const errorEl = document.getElementById('loginError');
    
    if (!username || !password) {
        errorEl.textContent = 'لطفاً نام کاربری و رمز عبور را وارد کنید';
        return;
    }
    
    const users = loadUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        errorEl.textContent = 'نام کاربری یا رمز عبور اشتباه است';
        return;
    }
    
    // ذخیره توکن اگر وارد شده باشد
    if (token) {
        localStorage.setItem('github_token', token);
    }
    
    // بروزرسانی آخرین ورود
    user.lastLogin = new Date().toLocaleString('fa-IR');
    saveUsers(users);
    
    // ذخیره در session
    currentUser = {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role
    };
    
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // نمایش برنامه اصلی
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    // بروزرسانی نمایش نام کاربر
    document.getElementById('userNameDisplay').innerHTML = `👤 ${currentUser.displayName} (${getRolePersian(currentUser.role)})`;
    
    // اعمال دسترسی‌ها
    applyPermissions();
    
    // مقداردهی اولیه برنامه
    if (typeof initApp === 'function') {
        initApp();
    }
    
    showToast(`خوش آمدید ${currentUser.displayName}`);
}

// تابع خروج
function logout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    
    // پاک کردن فرم لاگین
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').textContent = '';
}

// بررسی آیا کاربر لاگین کرده
function checkAuth() {
    const saved = sessionStorage.getItem('currentUser');
    if (saved) {
        currentUser = JSON.parse(saved);
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        document.getElementById('userNameDisplay').innerHTML = `👤 ${currentUser.displayName} (${getRolePersian(currentUser.role)})`;
        applyPermissions();
        return true;
    }
    return false;
}

// دریافت نام فارسی نقش
function getRolePersian(role) {
    const roles = {
        'admin': 'مدیر',
        'senior_keeper': 'انباردار ارشد',
        'junior_keeper': 'انباردار عادی',
        'supervisor': 'ناظر',
        'viewer': 'بازدیدکننده'
    };
    return roles[role] || role;
}

// بررسی دسترسی
function hasPermission(action) {
    if (!currentUser) return false;
    
    // مدیر به همه چیز دسترسی دارد
    if (currentUser.role === 'admin') return true;
    
    const rolePermissions = PERMISSIONS[currentUser.role];
    return rolePermissions && rolePermissions[action] === true;
}

// اعمال دسترسی‌ها روی UI
function applyPermissions() {
    if (!currentUser) return;
    
    const role = currentUser.role;
    const isAdmin = role === 'admin';
    const isSeniorKeeper = role === 'senior_keeper';
    const isJuniorKeeper = role === 'junior_keeper';
    const isSupervisor = role === 'supervisor';
    const isViewer = role === 'viewer';
    
    // ====== منوها ======
    // مدیریت کالاها (فقط مدیر)
    const menuProducts = document.getElementById('menuProducts');
    if (menuProducts) menuProducts.style.display = isAdmin ? 'block' : 'none';
    
    // مدیریت انبارها (فقط مدیر)
    const menuWarehouses = document.getElementById('menuWarehouses');
    if (menuWarehouses) menuWarehouses.style.display = isAdmin ? 'block' : 'none';
    
    // ورود کالا (فقط مدیر)
    const menuPurchase = document.getElementById('menuPurchase');
    if (menuPurchase) menuPurchase.style.display = isAdmin ? 'block' : 'none';
    
    // پشتیبان (فقط مدیر)
    const menuBackup = document.getElementById('menuBackup');
    if (menuBackup) menuBackup.style.display = isAdmin ? 'block' : 'none';
    
    // مدیریت کاربران (فقط مدیر)
    const menuUsers = document.getElementById('menuUsers');
    if (menuUsers) menuUsers.style.display = isAdmin ? 'block' : 'none';
    
    // ====== دکمه‌ها و بخش‌ها ======
    // دکمه افزودن کالا
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) addProductBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    
    // دکمه افزودن انبار
    const addWarehouseBtn = document.getElementById('addWarehouseBtn');
    if (addWarehouseBtn) addWarehouseBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    
    // دکمه ثبت ورود کالا
    const registerPurchaseBtn = document.getElementById('registerPurchaseBtn');
    if (registerPurchaseBtn) registerPurchaseBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    
    // دکمه ثبت انتقال
    const registerTransferBtn = document.getElementById('registerTransferBtn');
    if (registerTransferBtn) registerTransferBtn.style.display = (isAdmin || isSeniorKeeper) ? 'inline-flex' : 'none';
    
    // دکمه انتقال گروهی
    const bulkTransferBtn = document.getElementById('bulkTransferBtn');
    if (bulkTransferBtn) bulkTransferBtn.style.display = (isAdmin || isSeniorKeeper) ? 'inline-flex' : 'none';
    
    // دکمه ایجاد پشتیبان
    const createBackupBtn = document.getElementById('createBackupBtn');
    if (createBackupBtn) createBackupBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    
    // دکمه بازیابی
    const restoreBackupBtn = document.getElementById('restoreBackupBtn');
    if (restoreBackupBtn) restoreBackupBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    
    // دکمه وارد کردن از اکسل
    const importExcelBtn = document.getElementById('importExcelBtn');
    if (importExcelBtn) importExcelBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    
    // منطقه خطرناک (حذف همه داده‌ها)
    const dangerZone = document.getElementById('dangerZone');
    if (dangerZone) dangerZone.style.display = isAdmin ? 'block' : 'none';
    
    // ====== ستون قیمت‌ها (فقط مدیر) ======
    const priceColumns = document.querySelectorAll('.price-column');
    priceColumns.forEach(col => {
        if (isAdmin) {
            col.classList.remove('hidden');
        } else {
            col.classList.add('hidden');
        }
    });
    
    // ====== ستون عملیات (ویرایش/حذف - فقط مدیر) ======
    const actionColumns = document.querySelectorAll('.action-column');
    actionColumns.forEach(col => {
        if (isAdmin) {
            col.classList.remove('hidden');
        } else {
            col.classList.add('hidden');
        }
    });
    
    // ====== تب گزارش ارزش موجودی (فقط مدیر) ======
    const reportValueTab = document.getElementById('reportValueTab');
    if (reportValueTab) {
        reportValueTab.style.display = isAdmin ? 'inline-block' : 'none';
    }
    
    // ====== کارت ارزش کل موجودی (فقط مدیر) ======
    const statTotalValue = document.getElementById('statTotalValue');
    if (statTotalValue) {
        statTotalValue.style.display = isAdmin ? 'block' : 'none';
    }
}

// بررسی دسترسی برای عملیات خاص (در توابع استفاده می‌شود)
function checkActionPermission(action, showWarning = true) {
    if (hasPermission(action)) return true;
    
    if (showWarning) {
        showToast('شما دسترسی لازم برای این عملیات را ندارید');
    }
    return false;
}

// بررسی آیا کاربر می‌تواند انباری را ببیند
function canViewWarehouse(warehouseId) {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'senior_keeper') return true;
    if (currentUser.role === 'supervisor') return true;
    
    // انباردار عادی: فقط انبار خودش (اینجا می‌توانید منطق خود را پیاده کنید)
    // برای سادگی، فعلاً همه انبارها را به انباردار عادی نشان می‌دهیم
    return currentUser.role === 'junior_keeper';
}
