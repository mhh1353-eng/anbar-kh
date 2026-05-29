// ==================== تعریف نقش‌ها و دسترسی‌ها ====================

const ROLES = {
    ADMIN: 'admin',                    // مدیر - دسترسی کامل
    SENIOR_KEEPER: 'senior_keeper',    // انباردار ارشد - ورود (خیر)، خروج (بله)، انتقال (بله)
    JUNIOR_KEEPER: 'junior_keeper',    // انباردار عادی - فقط خروج از انبار خودش
    SUPERVISOR: 'supervisor',          // ناظر - فقط مشاهده
    VIEWER: 'viewer'                   // بازدیدکننده - حداقل دسترسی
};

// تعریف دسترسی‌ها بر اساس نقش
const PERMISSIONS = {
    // مدیر (شما) - دسترسی کامل
    [ROLES.ADMIN]: {
        can_purchase: true,           // ✅ ورود کالا
        can_consumption: true,        // ✅ خروج کالا
        can_transfer: true,           // ✅ انتقال بین انبارها
        can_edit_product: true,       // ✅ ویرایش کالاها
        can_delete: true,             // ✅ حذف تراکنش‌ها
        can_view_all: true,           // ✅ دیدن همه انبارها
        can_view_prices: true,        // ✅ دیدن قیمت‌ها
        can_manage_users: true,       // ✅ مدیریت کاربران
        can_export_excel: true,       // ✅ خروجی اکسل کامل
        can_view_reports: true,       // ✅ دیدن همه گزارش‌ها
        can_backup: true,             // ✅ پشتیبان‌گیری
        can_restore: true,            // ✅ بازیابی
        can_delete_all: true          // ✅ حذف همه داده‌ها
    },
    
    // انباردار ارشد
    [ROLES.SENIOR_KEEPER]: {
        can_purchase: false,          // ❌ ورود کالا (فقط مدیر)
        can_consumption: true,        // ✅ خروج کالا
        can_transfer: true,           // ✅ انتقال بین انبارها
        can_edit_product: false,      // ❌ ویرایش کالاها
        can_delete: false,            // ❌ حذف تراکنش‌ها
        can_view_all: true,           // ✅ دیدن همه انبارها
        can_view_prices: false,       // ❌ قیمت‌ها را نمی‌بیند
        can_manage_users: false,      // ❌ مدیریت کاربران
        can_export_excel: true,       // ✅ خروجی اکسل (بدون قیمت)
        can_view_reports: true,       // ✅ دیدن گزارش‌های عملیاتی
        can_backup: false,            // ❌ پشتیبان‌گیری
        can_restore: false,           // ❌ بازیابی
        can_delete_all: false         // ❌ حذف همه داده‌ها
    },
    
    // انباردار عادی
    [ROLES.JUNIOR_KEEPER]: {
        can_purchase: false,          // ❌ ورود کالا
        can_consumption: true,        // ✅ خروج کالا (فقط از انبار خودش)
        can_transfer: false,          // ❌ انتقال
        can_edit_product: false,
        can_delete: false,
        can_view_all: false,          // ❌ فقط انبار خودش
        can_view_prices: false,
        can_manage_users: false,
        can_export_excel: false,      // ❌ خروجی اکسل ندارد
        can_view_reports: false,      // ❌ گزارش‌ها را نمی‌بیند (یا خیلی محدود)
        can_backup: false,
        can_restore: false,
        can_delete_all: false
    },
    
    // ناظر (فقط مشاهده)
    [ROLES.SUPERVISOR]: {
        can_purchase: false,
        can_consumption: false,
        can_transfer: false,
        can_edit_product: false,
        can_delete: false,
        can_view_all: true,           // ✅ همه انبارها را می‌بینه
        can_view_prices: false,
        can_manage_users: false,
        can_export_excel: true,       // ✅ خروجی اکسل (بدون قیمت)
        can_view_reports: true,       // ✅ دیدن گزارش‌ها
        can_backup: false,
        can_restore: false,
        can_delete_all: false
    },
    
    // بازدیدکننده (حداقل دسترسی)
    [ROLES.VIEWER]: {
        can_purchase: false,
        can_consumption: false,
        can_transfer: false,
        can_edit_product: false,
        can_delete: false,
        can_view_all: false,          // ❌ فقط آمار کلی
        can_view_prices: false,
        can_manage_users: false,
        can_export_excel: false,
        can_view_reports: false,
        can_backup: false,
        can_restore: false,
        can_delete_all: false
    }
};

// تابع کمکی برای بررسی دسترسی
function userCan(role, action) {
    const permissions = PERMISSIONS[role];
    return permissions ? permissions[action] === true : false;
}