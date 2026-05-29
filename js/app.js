// ==================== توابع خروجی اکسل (کاملاً مشابه قبلی) ====================

// خروجی اکسل مدیریت کالاها
function exportProductsToExcel() {
    // بررسی دسترسی
    if (!hasPermission('can_export_excel')) {
        showToast('شما دسترسی خروجی اکسل ندارید');
        return;
    }
    
    // آماده‌سازی داده‌ها از جدول محصولات
    let tableData = [];
    
    products.forEach((product, index) => {
        let totalQty = inventory
            .filter(item => item.productId === product.id)
            .reduce((sum, item) => sum + item.quantity, 0);
        
        let warehouseInfo = [];
        warehouses.forEach(warehouse => {
            let item = inventory.find(i => i.productId === product.id && i.warehouseId === warehouse.id);
            if (item && item.quantity > 0) {
                warehouseInfo.push(`${warehouse.name}: ${formatNumber(item.quantity)}`);
            }
        });
        
        tableData.push({
            row: index + 1,
            code: `P${product.id.toString().padStart(4, '0')}`,
            name: product.name,
            unit: product.unit,
            stock: totalQty,
            warehouses: warehouseInfo.join(' | ') || '—',
            price: product.price
        });
    });
    
    // فیلتر بر اساس جستجو
    const searchValue = document.getElementById('productSearch')?.value || '';
    if (searchValue) {
        tableData = tableData.filter(p => 
            p.name.includes(searchValue) || p.unit.includes(searchValue)
        );
    }
    
    // مرتب‌سازی
    const sortCol = sortState.products.column;
    const sortDir = sortState.products.direction;
    
    tableData.sort((a, b) => {
        let valA, valB;
        switch(sortCol) {
            case 'row': valA = a.row; valB = b.row; break;
            case 'code': valA = a.code; valB = b.code; break;
            case 'name': valA = a.name; valB = b.name; break;
            case 'unit': valA = a.unit; valB = b.unit; break;
            case 'stock': valA = a.stock; valB = b.stock; break;
            default: valA = a.row; valB = b.row;
        }
        if (typeof valA === 'string') {
            return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            return sortDir === 'asc' ? valA - valB : valB - valA;
        }
    });
    
    tableData.forEach((item, idx) => { item.row = idx + 1; });
    
    // محاسبه آمار
    const totalProductsCount = tableData.length;
    const totalStock = tableData.reduce((sum, item) => sum + item.stock, 0);
    const totalValue = tableData.reduce((sum, item) => sum + (item.stock * item.price), 0);
    const lowStockCount = tableData.filter(item => item.stock < 10).length;
    const canViewPrices = hasPermission('can_view_prices');
    
    // ساخت HTML
    let html = `
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>گزارش مدیریت کالا</title>
            <style>
                * { font-family: 'Vazir', 'IRANSans', 'Tahoma', 'B Nazanin', sans-serif; }
                body { direction: rtl; padding: 20px; background-color: #F5F0E6; }
                .header { background: linear-gradient(135deg, #3E2723 0%, #5D4037 100%); color: #FAF7F2; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center; }
                .header h2 { margin: 0 0 10px 0; font-size: 22px; }
                .header p { margin: 5px 0; font-size: 14px; opacity: 0.9; }
                .stats-cards { display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
                .stat-card { background: linear-gradient(135deg, #3E2723, #5D4037); color: #FAF7F2; padding: 15px 25px; border-radius: 12px; text-align: center; flex: 1; min-width: 150px; }
                .stat-card .label { font-size: 13px; opacity: 0.9; }
                .stat-card .number { font-size: 24px; font-weight: bold; margin-top: 8px; color: #C6A15B; }
                table { width: 100%; border-collapse: collapse; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                th { background-color: #3E2723; color: #FAF7F2; padding: 12px 10px; text-align: center; font-size: 14px; font-weight: 500; border: 1px solid #5D4037; }
                td { padding: 10px; border-bottom: 1px solid #eee; text-align: center; font-size: 13px; }
                tr:hover { background-color: #FAF7F2; }
                .footer { margin-top: 20px; text-align: center; font-size: 11px; color: #8B6B4D; padding: 15px; border-top: 1px solid #C6A15B; }
                .warehouse-detail { font-size: 12px; color: #8B6B4D; }
                .low-stock { color: #e74c3c; font-weight: bold; }
                .normal-stock { color: #27ae60; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>📦 گزارش مدیریت کالاها</h2>
                <p>تاریخ تهیه گزارش: ${DEFAULT_PERSIAN_DATE}</p>
                <p>سامانه مدیریت جامع انبار رستوران</p>
            </div>
            
            <div class="stats-cards">
                <div class="stat-card">
                    <div class="label">📦 تعداد کل کالاها</div>
                    <div class="number">${toPersianNumbers(totalProductsCount.toString())}</div>
                </div>
                <div class="stat-card">
                    <div class="label">📊 مجموع موجودی (واحد)</div>
                    <div class="number">${toPersianNumbers(Math.round(totalStock).toString())}</div>
                </div>
                ${canViewPrices ? `
                <div class="stat-card">
                    <div class="label">💰 ارزش کل موجودی</div>
                    <div class="number">${formatPrice(totalValue)}</div>
                </div>
                ` : ''}
                <div class="stat-card">
                    <div class="label">⚠️ کالاهای کم‌موجود</div>
                    <div class="number">${toPersianNumbers(lowStockCount.toString())}</div>
                </div>
            </div>
            
            <table cellspacing="0">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>کد کالا</th>
                        <th>عنوان کالا</th>
                        <th>واحد شمارش</th>
                        <th>موجودی کل</th>
                        ${canViewPrices ? '<th>قیمت واحد (ریال)</th><th>ارزش کل (ریال)</th>' : ''}
                        <th>توزیع در انبارها</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    tableData.forEach(item => {
        const itemValue = item.stock * item.price;
        const stockClass = item.stock < 10 ? 'low-stock' : 'normal-stock';
        
        html += `
            <tr>
                <td>${toPersianNumbers(item.row.toString())}</td>
                <td>${item.code}</td>
                <td style="text-align: right; font-weight: 500;">${item.name}</td>
                <td>${item.unit}</td>
                <td class="${stockClass}">${formatNumber(item.stock)}</td>
                ${canViewPrices ? `<td>${formatPrice(item.price)}</td><td>${formatPrice(itemValue)}</td>` : ''}
                <td class="warehouse-detail">${item.warehouses}</td>
            </tr>
        `;
    });
    
    if (tableData.length === 0) {
        html += `<tr><td colspan="${canViewPrices ? 7 : 5}" style="text-align: center; padding: 40px;">هیچ کالایی یافت نشد</td></tr>`;
    }
    
    html += `
                </tbody>
             </table>
            
            <div class="footer">
                <p>این گزارش به صورت خودکار توسط نرم‌افزار مدیریت جامع انبار رستوران تهیه شده است.</p>
                <p>تاریخ چاپ: ${DEFAULT_PERSIAN_DATE} - ساعت: ${new Date().toLocaleTimeString('fa-IR')}</p>
            </div>
        </body>
        </html>
    `;
    
    const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `گزارش_مدیریت_کالا_${DEFAULT_PERSIAN_DATE.replace(/\//g, '_')}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('✅ گزارش با فرمت اکسل ذخیره شد');
}

// خروجی اکسل ورودی‌ها
function exportPurchaseToExcel() {
    if (!hasPermission('can_export_excel')) {
        showToast('شما دسترسی خروجی اکسل ندارید');
        return;
    }
    
    const purchaseTransactions = transactions.filter(t => t.type === 'purchase');
    const canViewPrices = hasPermission('can_view_prices');
    
    let csvContent = "گزارش ورودی‌های انبار\n";
    csvContent += "تاریخ گزارش: " + DEFAULT_PERSIAN_DATE + "\n\n";
    csvContent += "ردیف,تاریخ,کالا,انبار,تعداد" + (canViewPrices ? ",قیمت واحد" : "") + ",توضیحات\n";
    
    purchaseTransactions.slice().reverse().forEach((t, index) => {
        const product = products.find(p => p.id === t.productId);
        const warehouse = warehouses.find(w => w.id === t.toWarehouse);
        
        csvContent += `${index + 1},${t.date || DEFAULT_PERSIAN_DATE},${product?.name || ''},${warehouse?.name || ''},${t.quantity}`;
        if (canViewPrices) {
            csvContent += `,${t.price}`;
        }
        csvContent += `,${t.description || ''}\n`;
    });
    
    downloadCSV(csvContent, 'ورودی_کالا.csv');
    showToast('گزارش ورودی‌ها با موفقیت خروجی گرفته شد');
}

// خروجی اکسل خروجی‌ها
function exportConsumptionToExcel() {
    if (!hasPermission('can_export_excel')) {
        showToast('شما دسترسی خروجی اکسل ندارید');
        return;
    }
    
    const consumptionTransactions = transactions.filter(t => t.type === 'consumption');
    
    let csvContent = "گزارش خروجی‌های انبار\n";
    csvContent += "تاریخ گزارش: " + DEFAULT_PERSIAN_DATE + "\n\n";
    csvContent += "ردیف,تاریخ,کالا,انبار,تعداد,دلیل,توضیحات\n";
    
    consumptionTransactions.slice().reverse().forEach((t, index) => {
        const product = products.find(p => p.id === t.productId);
        const warehouse = warehouses.find(w => w.id === t.fromWarehouse);
        
        csvContent += `${index + 1},${t.date || DEFAULT_PERSIAN_DATE},${product?.name || ''},${warehouse?.name || ''},${t.quantity},${t.reason || ''},${t.description || ''}\n`;
    });
    
    downloadCSV(csvContent, 'خروجی_کالا.csv');
    showToast('گزارش خروجی‌ها با موفقیت خروجی گرفته شد');
}

// خروجی اکسل گزارش گردش کالا
function exportMovementToExcel() {
    if (!hasPermission('can_export_excel')) {
        showToast('شما دسترسی خروجی اکسل ندارید');
        return;
    }
    
    const fromDate = document.getElementById('movementFromDate').value;
    const toDate = document.getElementById('movementToDate').value;
    const productId = document.getElementById('movementProduct').value;
    const type = document.getElementById('movementType').value;

    let filteredTransactions = transactions.filter(t => {
        if (type !== 'all' && t.type !== type) return false;
        if (productId && t.productId != productId) return false;
        if (!isDateInRange(t.date, fromDate, toDate)) return false;
        return true;
    });

    filteredTransactions.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    let openingBalances = {};
    const uniqueProductIds = [...new Set(filteredTransactions.map(t => t.productId))];
    
    uniqueProductIds.forEach(pid => {
        let currentStock = inventory
            .filter(item => item.productId === pid)
            .reduce((sum, item) => sum + item.quantity, 0);
        
        let allTransactions = transactions.filter(t => t.productId === pid);
        
        let totalIn = 0;
        let totalOut = 0;
        
        allTransactions.forEach(t => {
            if (t.type === 'purchase') {
                totalIn += t.quantity;
            } else if (t.type === 'consumption') {
                totalOut += t.quantity;
            } else if (t.type === 'transfer') {
                totalOut += t.quantity;
            }
        });
        
        let openingStock = currentStock - totalIn + totalOut;
        
        let transactionsBeforeRange = allTransactions.filter(t => {
            return isDateBefore(t.date, fromDate);
        });
        
        let inBeforeRange = 0;
        let outBeforeRange = 0;
        
        transactionsBeforeRange.forEach(t => {
            if (t.type === 'purchase') {
                inBeforeRange += t.quantity;
            } else if (t.type === 'consumption' || t.type === 'transfer') {
                outBeforeRange += t.quantity;
            }
        });
        
        openingBalances[pid] = openingStock + inBeforeRange - outBeforeRange;
        if (openingBalances[pid] < 0) openingBalances[pid] = 0;
    });
    
    let rows = [];
    let runningBalances = { ...openingBalances };
    const canViewPrices = hasPermission('can_view_prices');
    
    filteredTransactions.forEach((t, index) => {
        const product = products.find(p => p.id === t.productId);
        if (!product) return;
        
        let typeText = '';
        let inQty = 0;
        let outQty = 0;
        
        if (t.type === 'purchase') {
            typeText = 'ورود';
            inQty = t.quantity;
            runningBalances[t.productId] += t.quantity;
        } else if (t.type === 'consumption') {
            typeText = 'خروج';
            outQty = t.quantity;
            runningBalances[t.productId] -= t.quantity;
        } else if (t.type === 'transfer') {
            typeText = 'انتقال';
            outQty = t.quantity;
            runningBalances[t.productId] -= t.quantity;
        }
        
        const fromWh = t.fromWarehouse ? warehouses.find(w => w.id === t.fromWarehouse) : null;
        const toWh = t.toWarehouse ? warehouses.find(w => w.id === t.toWarehouse) : null;
        
        rows.push({
            row: index + 1,
            date: t.date || DEFAULT_PERSIAN_DATE,
            product: product.name,
            unit: product.unit,
            type: typeText,
            from: fromWh?.name || '—',
            to: toWh?.name || '—',
            in_qty: inQty,
            out_qty: outQty,
            balance: runningBalances[t.productId],
            price: t.price || '',
            desc: t.description || t.reason || '—'
        });
    });

    let html = `
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>گزارش گردش کالا</title>
            <style>
                body { font-family: 'Vazir', 'IRANSans', 'Tahoma', 'B Nazanin', sans-serif; margin: 20px; direction: rtl; }
                th { background-color: #3E2723; color: white; padding: 10px 8px; text-align: center; font-weight: bold; }
                td { padding: 8px; border: 1px solid #ddd; text-align: center; }
                .in { color: #27ae60; font-weight: bold; }
                .out { color: #e74c3c; font-weight: bold; }
                .balance { color: #2980b9; font-weight: bold; background-color: #f0f8ff; }
                table { border-collapse: collapse; width: 100%; direction: rtl; }
                .header-info { margin-bottom: 20px; font-size: 14px; text-align: center; }
                .total-row { background-color: #f5f5f5; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header-info">
                <h2>📊 گزارش گردش کالا</h2>
                <p>از تاریخ: ${fromDate || 'ابتدا'} تا: ${toDate || 'امروز'}</p>
                <p>تاریخ تهیه گزارش: ${DEFAULT_PERSIAN_DATE}</p>
                <hr>
            </div>
            <table cellspacing="0">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>تاریخ</th>
                        <th>کالا</th>
                        <th>واحد</th>
                        <th>نوع</th>
                        <th>انبار مبدأ</th>
                        <th>انبار مقصد</th>
                        <th>ورود</th>
                        <th>خروج</th>
                        <th>مانده پس از تراکنش</th>
                        ${canViewPrices ? '<th>قیمت واحد</th>' : ''}
                        <th>توضیحات</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    rows.forEach(row => {
        html += `
            <tr>
                <td>${toPersianNumbers(row.row.toString())}</td>
                <td>${row.date}</td>
                <td>${row.product}</td>
                <td>${row.unit}</td>
                <td>${row.type}</td>
                <td>${row.from}</td>
                <td>${row.to}</td>
                <td class="in">${row.in_qty > 0 ? formatNumber(row.in_qty) : '—'}</td>
                <td class="out">${row.out_qty > 0 ? formatNumber(row.out_qty) : '—'}</td>
                <td class="balance">${formatNumber(row.balance)}</td>
                ${canViewPrices ? `<td class="price-cell">${row.price ? formatPrice(row.price) : '—'}</td>` : ''}
                <td>${row.desc}</td>
            </tr>
        `;
    });
    
    const totalIn = rows.reduce((sum, r) => sum + r.in_qty, 0);
    const totalOut = rows.reduce((sum, r) => sum + r.out_qty, 0);
    const lastBalance = rows.length > 0 ? rows[rows.length-1].balance : 0;
    
    html += `
                    <tr class="total-row">
                        <td colspan="7" style="text-align: left;"><strong>جمع کل:</strong></td>
                        <td><strong>${formatNumber(totalIn)}</strong></td>
                        <td><strong>${formatNumber(totalOut)}</strong></td>
                        <td><strong>${formatNumber(lastBalance)}</strong></td>
                        ${canViewPrices ? '<td colspan="2"></td>' : '<td colspan="1"></td>'}
                     </tr>
                </tbody>
            </table>
            <br>
            <footer style="font-size: 11px; color: #888; text-align: center; margin-top: 20px;">
                نرم‌افزار مدیریت جامع انبار رستوران
            </footer>
        </body>
        </html>
    `;
    
    const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `گزارش_گردش_کالا_${DEFAULT_PERSIAN_DATE.replace(/\//g, '_')}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('گزارش با فرمت اکسل ذخیره شد');
}

// خروجی اکسل موجودی انبار
function exportInventoryToExcel() {
    if (!hasPermission('can_export_excel')) {
        showToast('شما دسترسی خروجی اکسل ندارید');
        return;
    }
    
    const selectedWarehouses = getSelectedWarehouses();
    const canViewPrices = hasPermission('can_view_prices');
    
    let rows = [];
    
    products.forEach(product => {
        let totalQty = 0;
        let totalValue = 0;
        let warehouseDetails = [];
        
        warehouses.forEach(warehouse => {
            if (!selectedWarehouses.includes(warehouse.id)) return;
            
            let item = inventory.find(i => i.productId === product.id && i.warehouseId === warehouse.id);
            let qty = item ? item.quantity : 0;
            
            if (qty > 0) {
                totalQty += qty;
                totalValue += qty * product.price;
                warehouseDetails.push(`${warehouse.name}: ${formatNumber(qty)}`);
            }
        });
        
        if (totalQty > 0) {
            let status = '';
            let statusColor = '';
            if (totalQty < 5) {
                status = 'بحرانی';
                statusColor = 'red';
            } else if (totalQty < 20) {
                status = 'کم‌موجود';
                statusColor = 'orange';
            } else {
                status = 'نرمال';
                statusColor = 'green';
            }
            
            rows.push({
                row: rows.length + 1,
                code: `P${product.id.toString().padStart(4, '0')}`,
                name: product.name,
                unit: product.unit,
                price: product.price,
                quantity: totalQty,
                value: totalValue,
                warehouses: warehouseDetails.join(' | '),
                status: status
            });
        }
    });
    
    const totalValueRaw = rows.reduce((sum, row) => sum + row.value, 0);
    
    let html = `
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>گزارش موجودی انبار</title>
            <style>
                th { background-color: #3E2723; color: white; padding: 8px; text-align: center; }
                td { padding: 6px; border: 1px solid #ddd; }
                table { border-collapse: collapse; width: 100%; direction: rtl; }
                .header-info { margin-bottom: 20px; text-align: center; }
                .total-row { background-color: #f0f0f0; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header-info">
                <h2>📦 گزارش موجودی انبار</h2>
                <p>تاریخ تهیه گزارش: ${DEFAULT_PERSIAN_DATE}</p>
                <hr>
            </div>
            <table cellspacing="0">
                <thead>
                    <tr>
                        <th>ردیف</th>
                        <th>کد کالا</th>
                        <th>عنوان کالا</th>
                        <th>واحد</th>
                        ${canViewPrices ? '<th>قیمت واحد</th>' : ''}
                        <th>موجودی کل</th>
                        ${canViewPrices ? '<th>ارزش کل</th>' : ''}
                        <th>توزیع در انبارها</th>
                        <th>وضعیت</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    rows.forEach(row => {
        html += `
            <tr>
                <td style="text-align: center;">${toPersianNumbers(row.row.toString())}</td>
                <td style="text-align: center;">${row.code}</td>
                <td>${row.name}</td>
                <td style="text-align: center;">${row.unit}</td>
                ${canViewPrices ? `<td style="text-align: left;">${formatPrice(row.price)}</td>` : ''}
                <td style="text-align: center;">${formatNumber(row.quantity)}</td>
                ${canViewPrices ? `<td style="text-align: left;">${formatPrice(row.value)}</td>` : ''}
                <td>${row.warehouses}</td>
                <td style="text-align: center;">${row.status}</td>
            </tr>
        `;
    });
    
    html += `
                    <tr class="total-row">
                        <td colspan="${canViewPrices ? 4 : 3}" style="text-align: left;"><strong>جمع کل ارزش موجودی:</strong></td>
                        <td colspan="${canViewPrices ? 4 : 3}"><strong>${formatPrice(totalValueRaw)}</strong></td>
                     </tr>
                </tbody>
            </table>
        </body>
        </html>
    `;
    
    const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `موجودی_انبار_${DEFAULT_PERSIAN_DATE.replace(/\//g, '_')}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('گزارش موجودی با فرمت اکسل ذخیره شد');
}

// تابع کمکی دانلود CSV
function downloadCSV(csvContent, fileName) {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
// ==================== داده‌های اولیه ====================

// انبار اصلی
const MAIN_WAREHOUSE_ID = 1;

// تعداد آیتم در هر صفحه
const ITEMS_PER_PAGE = 50;

// تاریخ پیش‌فرض شمسی
let DEFAULT_PERSIAN_DATE = "۱۴۰۴/۱۲/۰۶";

// متغیرهای سراسری
let sortState = {
    dashboard: { column: 'row', direction: 'asc' },
    products: { column: 'row', direction: 'asc' },
    warehouses: { column: 'row', direction: 'asc' },
    purchase: { column: 'date', direction: 'desc' },
    consumption: { column: 'date', direction: 'desc' },
    movement: { column: 'date', direction: 'desc' }
};

let paginationState = {
    purchase: { page: 1, totalPages: 1 },
    consumption: { page: 1, totalPages: 1 }
};

// داده‌های اصلی برنامه
let products = [];
let warehouses = [];
let inventory = [];
let transactions = [];

let selectedProductId = null;
let currentEditProductId = null;
// ==================== همگام‌سازی با Gist ====================
// ⚠️ این دو مقدار را با مقادیر خودتان جایگزین کنید ⚠️
const GIST_ID = "d9d233e7caa54b86d96cba753b3171db";
const GITHUB_TOKEN = "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";

// تابع ارسال به Gist
// تابع ارسال به Gist
async function syncToGist() {
    showToast("📡 در حال ارسال به سرور...");
    
    const data = {
        products: products,
        warehouses: warehouses,
        inventory: inventory,
        transactions: transactions,
        lastUpdate: new Date().toISOString()
    };
    
    const content = JSON.stringify(data, null, 2);
    
    const updateData = {
        files: {
            'anbar-data.json': {
                content: content
            }
        }
    };
    
    try {
        const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
            showToast("✅ داده‌ها با موفقیت به سرور ارسال شد");
        } else {
            const errorText = await response.text();
            console.error("Error:", errorText);
            showToast(`❌ خطا در ارسال: ${response.status}`);
        }
    } catch(error) {
        console.error("Network error:", error);
        showToast("❌ خطای شبکه: " + error.message);
    }
}

// تابع دریافت از Gist
async function syncFromGist() {
    showToast("📡 در حال دریافت از سرور...");
    try {
        // آدرس RAW برای Gist عمومی (بدون نیاز به توکن)
        const rawUrl = `https://gist.githubusercontent.com/mhh1353-eng/${GIST_ID}/raw/anbar-data.json`;
        
        const response = await fetch(rawUrl);
        
        if (response.ok) {
            const data = await response.json();
            products = data.products || [];
            warehouses = data.warehouses || [];
            inventory = data.inventory || [];
            transactions = data.transactions || [];
            
            autoSave();
            refreshAllPages();
            showToast("✅ داده‌ها با موفقیت دریافت شد");
        } else {
            showToast(`❌ خطا: ${response.status} - فایل پیدا نشد`);
        }
    } catch(error) {
        console.error("Network error:", error);
        showToast("❌ خطای شبکه: " + error.message);
    }
}
// تابع بروزرسانی همه صفحات
function refreshAllPages() {
    renderInventory(getSelectedWarehouses());
    renderProducts();
    renderWarehouses();
    renderPurchaseHistory();
    renderConsumptionHistory();
    if (typeof generateMovementReport === 'function') {
        generateMovementReport();
    }
}

// ==================== توابع تبدیل تاریخ ====================

function toPersianNumbers(str) {
    if (!str && str !== 0) return str;
    str = str.toString();
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return str.replace(/[0-9]/g, function(w) {
        return persianDigits[+w];
    });
}

function toEnglishNumbers(str) {
    if (!str && str !== 0) return str;
    str = str.toString();
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    
    let result = str;
    for (let i = 0; i < 10; i++) {
        const regex = new RegExp(persianDigits[i], 'g');
        result = result.replace(regex, i);
        const regex2 = new RegExp(arabicDigits[i], 'g');
        result = result.replace(regex2, i);
    }
    return result;
}

function convertToPersianDate(input) {
    if (!input.value) return;
    input.value = toPersianNumbers(input.value);
}

function getNumericDate(persianDate) {
    if (!persianDate) return 0;
    const englishDate = toEnglishNumbers(persianDate);
    return parseInt(englishDate.replace(/[^0-9]/g, '')) || 0;
}

function isDateInRange(date, fromDate, toDate) {
    if (!date) return true;
    const dateNum = getNumericDate(date);
    const fromNum = getNumericDate(fromDate);
    const toNum = getNumericDate(toDate);
    if (fromNum && dateNum < fromNum) return false;
    if (toNum && dateNum > toNum) return false;
    return true;
}

function isDateBefore(date1, date2) {
    if (!date1 || !date2) return false;
    return getNumericDate(date1) < getNumericDate(date2);
}

// دریافت تاریخ امروز به شمسی (نسخه اصلاح شده)
function getTodayPersianDate() {
    const now = new Date();
    
    // استفاده از toLocaleDateString با تنظیمات منطقه ایران
    const persianDate = now.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    // خروجی به فرمت YYYY/MM/DD
    return persianDate;
}

function updateAllDates() {
    const today = getTodayPersianDate();
    DEFAULT_PERSIAN_DATE = today;
    const dateElement = document.querySelector('#currentDate span');
    if (dateElement) dateElement.textContent = today;
    document.querySelectorAll('.persian-date').forEach(input => {
        if (!input.value || input.value === '') input.value = today;
    });
}

// ==================== توابع فرمت اعداد ====================

function roundToTwoDecimals(num) {
    if (num === null || num === undefined || isNaN(num)) return 0;
    return Math.round(num * 100) / 100;
}

function formatPrice(price) {
    if (!price && price !== 0) return "۰ ریال";
    const roundedPrice = roundToTwoDecimals(price);
    if (roundedPrice % 1 !== 0) {
        return toPersianNumbers(roundedPrice.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")) + " ریال";
    }
    return toPersianNumbers(roundedPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")) + " ریال";
}

function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return "۰";
    const roundedNum = roundToTwoDecimals(num);
    if (roundedNum % 1 !== 0) {
        return toPersianNumbers(roundedNum.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
    }
    return toPersianNumbers(roundedNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
}

function formatNumberInput(input) {
    let value = input.value.replace(/,/g, '');
    value = toEnglishNumbers(value);
    if (value) {
        const num = parseFloat(value);
        if (!isNaN(num)) {
            input.value = toPersianNumbers(roundToTwoDecimals(num).toLocaleString());
        }
    }
}

// ==================== توابع کمکی ====================

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    delete document.getElementById(modalId).dataset.editId;
    currentEditProductId = null;
}

function getSelectedWarehouses() {
    const checkboxes = document.querySelectorAll('#warehouseCheckboxes input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => parseInt(cb.value));
}

// ==================== توابع مرتب‌سازی ====================

function sortTable(tableId, column) {
    const currentState = sortState[tableId];
    let direction = 'asc';
    if (currentState.column === column) {
        direction = currentState.direction === 'asc' ? 'desc' : 'asc';
    }
    sortState[tableId] = { column, direction };
    updateSortIcons(tableId, column, direction);
    
    switch(tableId) {
        case 'dashboard': renderInventory(getSelectedWarehouses()); break;
        case 'products': renderProducts(document.getElementById('productSearch').value); break;
        case 'warehouses': renderWarehouses(); break;
        case 'purchase': renderPurchaseHistory(); break;
        case 'consumption': renderConsumptionHistory(); break;
        case 'movement': generateMovementReport(); break;
    }
}

function updateSortIcons(tableId, column, direction) {
    document.querySelectorAll(`[id^="sort-icon-${tableId}-"]`).forEach(icon => {
        if (icon) icon.innerHTML = '↕️';
    });
    const icon = document.getElementById(`sort-icon-${tableId}-${column}`);
    if (icon) icon.innerHTML = direction === 'asc' ? '↑' : '↓';
}

// ==================== توابع صفحه‌بندی ====================

function renderPagination(tableId, totalItems) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    paginationState[tableId].totalPages = totalPages || 1;
    const paginationElement = document.getElementById(`${tableId}-pagination`);
    if (!paginationElement) return;
    
    let html = '';
    html += `<div class="pagination-item ${paginationState[tableId].page === 1 ? 'disabled' : ''}" 
        onclick="${paginationState[tableId].page > 1 ? `changePage('${tableId}', ${paginationState[tableId].page - 1})` : ''}">«</div>`;
    
    let startPage = Math.max(1, paginationState[tableId].page - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<div class="pagination-item ${paginationState[tableId].page === i ? 'active' : ''}" 
            onclick="changePage('${tableId}', ${i})">${toPersianNumbers(i.toString())}</div>`;
    }
    
    html += `<div class="pagination-item ${paginationState[tableId].page === totalPages ? 'disabled' : ''}" 
        onclick="${paginationState[tableId].page < totalPages ? `changePage('${tableId}', ${paginationState[tableId].page + 1})` : ''}">»</div>`;
    
    paginationElement.innerHTML = html;
    
    const start = (paginationState[tableId].page - 1) * ITEMS_PER_PAGE + 1;
    const end = Math.min(paginationState[tableId].page * ITEMS_PER_PAGE, totalItems);
    document.getElementById(`${tableId}-start`).textContent = toPersianNumbers(totalItems > 0 ? start.toString() : '0');
    document.getElementById(`${tableId}-end`).textContent = toPersianNumbers(end.toString());
    document.getElementById(`${tableId}-total`).textContent = toPersianNumbers(totalItems.toString());
}

function changePage(tableId, page) {
    paginationState[tableId].page = page;
    if (tableId === 'purchase') renderPurchaseHistory();
    if (tableId === 'consumption') renderConsumptionHistory();
}

// ==================== توابع اصلی رندر ====================

function renderInventory(selectedWarehouses = [1,2,3,4]) {
    const tbody = document.getElementById('inventoryBody');
    if (!tbody) return;
    
    let tableData = [];
    products.forEach(product => {
        let totalQty = 0;
        let productValue = 0;
        inventory.forEach(item => {
            if (item.productId === product.id && selectedWarehouses.includes(item.warehouseId)) {
                totalQty += item.quantity;
                productValue += item.quantity * product.price;
            }
        });
        if (totalQty > 0) {
            tableData.push({
                row: tableData.length + 1,
                name: product.name,
                unit: product.unit,
                quantity: totalQty,
                price: product.price,
                total: productValue
            });
        }
    });
    
    const sortCol = sortState.dashboard.column;
    const sortDir = sortState.dashboard.direction;
    tableData.sort((a, b) => {
        let valA, valB;
        switch(sortCol) {
            case 'row': valA = a.row; valB = b.row; break;
            case 'name': valA = a.name; valB = b.name; break;
            case 'unit': valA = a.unit; valB = b.unit; break;
            case 'quantity': valA = a.quantity; valB = b.quantity; break;
            case 'price': valA = a.price; valB = b.price; break;
            case 'total': valA = a.total; valB = b.total; break;
            default: valA = a.row; valB = b.row;
        }
        if (typeof valA === 'string') {
            return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            return sortDir === 'asc' ? valA - valB : valB - valA;
        }
    });
    
    let totalValue = tableData.reduce((sum, item) => sum + item.total, 0);
    let lowStockCount = tableData.filter(item => item.quantity < 10).length;
    const canViewPrices = hasPermission('can_view_prices');
    
    let html = '';
    tableData.forEach((item, index) => {
        item.row = index + 1;
        html += `<tr>
            <td>${toPersianNumbers(item.row.toString())}</td>
            <td>${item.name}</td>
            <td>${item.unit}</td>
            <td>${formatNumber(item.quantity)}</td>
            ${canViewPrices ? `<td class="price">${formatPrice(item.price)}</td><td class="price">${formatPrice(item.total)}</td>` : '<td colspan="2"></td>'}
        </tr>`;
    });
    
    tbody.innerHTML = html || '<tr><td colspan="6" style="text-align: center;">هیچ کالایی با موجودی پیدا نشد</td></tr>';
    document.getElementById('totalValue').innerText = canViewPrices ? formatPrice(totalValue) : '*****';
    document.getElementById('totalProducts').innerText = toPersianNumbers(products.length.toString());
    document.getElementById('lowStock').innerText = toPersianNumbers(lowStockCount.toString());
}

function renderWarehouseCheckboxes() {
    const container = document.getElementById('warehouseCheckboxes');
    if (!container) return;
    let html = '';
    warehouses.forEach(warehouse => {
        html += `<div class="warehouse-checkbox">
            <input type="checkbox" id="wh_${warehouse.id}" value="${warehouse.id}" checked onchange="filterInventory()">
            <label for="wh_${warehouse.id}">${warehouse.name}</label>
        </div>`;
    });
    container.innerHTML = html;
    document.getElementById('totalWarehouses').innerText = toPersianNumbers(warehouses.length.toString());
}

function filterInventory() {
    renderInventory(getSelectedWarehouses());
}

function renderProducts(filter = '') {
    const tbody = document.getElementById('productsBody');
    if (!tbody) return;
    
    let filteredProducts = products;
    if (filter) filteredProducts = products.filter(p => p.name.includes(filter) || p.unit.includes(filter));
    
    let tableData = filteredProducts.map((product, index) => {
        let warehouseInfo = [];
        warehouses.forEach(warehouse => {
            let item = inventory.find(i => i.productId === product.id && i.warehouseId === warehouse.id);
            if (item && item.quantity > 0) warehouseInfo.push(`${warehouse.name}: ${formatNumber(item.quantity)}`);
        });
        let totalQty = inventory.filter(item => item.productId === product.id).reduce((sum, item) => sum + item.quantity, 0);
        return {
            row: index + 1,
            code: `P${product.id.toString().padStart(4, '0')}`,
            name: product.name,
            unit: product.unit,
            stock: totalQty,
            warehouseInfo: warehouseInfo.join('<br>') || '—',
            id: product.id
        };
    });
    
    const sortCol = sortState.products.column;
    const sortDir = sortState.products.direction;
    tableData.sort((a, b) => {
        let valA, valB;
        switch(sortCol) {
            case 'row': valA = a.row; valB = b.row; break;
            case 'code': valA = a.code; valB = b.code; break;
            case 'name': valA = a.name; valB = b.name; break;
            case 'unit': valA = a.unit; valB = b.unit; break;
            case 'stock': valA = a.stock; valB = b.stock; break;
            default: valA = a.row; valB = b.row;
        }
        if (typeof valA === 'string') {
            return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            return sortDir === 'asc' ? valA - valB : valB - valA;
        }
    });
    
    const canEdit = hasPermission('can_edit_product');
    const canViewPrices = hasPermission('can_view_prices');
    
    let html = '';
    tableData.forEach((item, index) => {
        item.row = index + 1;
        html += `<tr oncontextmenu="showContextMenu(event, ${item.id})">
            <td>${toPersianNumbers(item.row.toString())}</td>
            <td>${item.code}</td>
            <td>${item.name}</td>
            <td>${item.unit}</td>
            <td>${formatNumber(item.stock)}</td>
            <td>${item.warehouseInfo}</td>
            ${canEdit ? `<td class="action-column">
                <button class="btn btn-gold" style="padding: 4px 8px;" onclick="editProduct(${item.id})">✏️</button>
                <button class="btn btn-info" style="padding: 4px 8px;" onclick="showProductHistoryById(${item.id})">📋</button>
                <button class="btn btn-danger" style="padding: 4px 8px;" onclick="deleteProduct(${item.id})">🗑️</button>
            </td>` : '<td class="action-column hidden"></td>'}
        </tr>`;
    });
    tbody.innerHTML = html;
}

function filterProducts() {
    renderProducts(document.getElementById('productSearch').value);
}

function renderWarehouses() {
    const tbody = document.getElementById('warehousesBody');
    if (!tbody) return;
    
    let tableData = warehouses.map((warehouse, index) => {
        let itemCount = 0;
        let totalValue = 0;
        inventory.forEach(item => {
            if (item.warehouseId === warehouse.id && item.quantity > 0) {
                itemCount++;
                let product = products.find(p => p.id === item.productId);
                if (product) totalValue += item.quantity * product.price;
            }
        });
        return { row: index + 1, name: warehouse.name, status: warehouse.status, count: itemCount, value: totalValue, id: warehouse.id };
    });
    
    const sortCol = sortState.warehouses.column;
    const sortDir = sortState.warehouses.direction;
    tableData.sort((a, b) => {
        let valA, valB;
        switch(sortCol) {
            case 'row': valA = a.row; valB = b.row; break;
            case 'name': valA = a.name; valB = b.name; break;
            case 'status': valA = a.status; valB = b.status; break;
            case 'count': valA = a.count; valB = b.count; break;
            case 'value': valA = a.value; valB = b.value; break;
            default: valA = a.row; valB = b.row;
        }
        if (typeof valA === 'string') {
            return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            return sortDir === 'asc' ? valA - valB : valB - valA;
        }
    });
    
    const canEdit = hasPermission('can_edit_product');
    const canViewPrices = hasPermission('can_view_prices');
    
    let html = '';
    tableData.forEach((item, index) => {
        item.row = index + 1;
        html += `<tr>
            <td>${toPersianNumbers(item.row.toString())}</td>
            <td>${item.name}</td>
            <td><span style="color: ${item.status === 'active' ? 'green' : 'red'}">${item.status === 'active' ? 'فعال' : 'غیرفعال'}</span></td>
            <td>${toPersianNumbers(item.count.toString())}</td>
            ${canViewPrices ? `<td class="price-column">${formatPrice(item.value)}</td>` : '<td class="price-column hidden"></td>'}
            ${canEdit ? `<td class="action-column">
                <button class="btn btn-gold" style="padding: 4px 8px;" onclick="editWarehouse(${item.id})">✏️</button>
                ${item.id !== MAIN_WAREHOUSE_ID ? `<button class="btn btn-danger" style="padding: 4px 8px;" onclick="deleteWarehouse(${item.id})">🗑️</button>` : ''}
            </td>` : '<td class="action-column hidden"></td>'}
        </tr>`;
    });
    tbody.innerHTML = html;
}

// ==================== پر کردن سلکت‌ها ====================

function populateProductSelects() {
    const productSelects = ['purchaseProduct', 'consumptionProduct', 'transferProduct', 'movementProduct', 'editTransactionProduct'];
    productSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        let options = selectId === 'movementProduct' ? '<option value="">همه کالاها</option>' : '<option value="">انتخاب کنید</option>';
        const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));
        sortedProducts.forEach(product => {
            options += `<option value="${product.id}">${product.name} (${product.unit})</option>`;
        });
        select.innerHTML = options;
    });
}

function populateWarehouseSelects() {
    const warehouseSelects = ['purchaseWarehouse', 'consumptionWarehouse', 'transferFromWarehouse', 'transferToWarehouse', 'bulkFromWarehouse', 'bulkToWarehouse', 'productWarehouse', 'editWarehouseSelect', 'editTransactionWarehouse'];
    warehouseSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = '<option value="">انتخاب کنید</option>';
        warehouses.forEach(warehouse => {
            select.innerHTML += `<option value="${warehouse.id}">${warehouse.name}</option>`;
        });
    });
}

function updateConsumptionWarehouses() {
    const productId = document.getElementById('consumptionProduct').value;
    const warehouseSelect = document.getElementById('consumptionWarehouse');
    if (!productId) {
        warehouseSelect.innerHTML = '<option value="">ابتدا کالا را انتخاب کنید</option>';
        return;
    }
    warehouseSelect.innerHTML = '<option value="">انتخاب کنید</option>';
    let hasStock = false;
    warehouses.forEach(warehouse => {
        let item = inventory.find(i => i.productId == productId && i.warehouseId === warehouse.id);
        if (item && item.quantity > 0) {
            warehouseSelect.innerHTML += `<option value="${warehouse.id}">${warehouse.name} (موجودی: ${formatNumber(item.quantity)})</option>`;
            hasStock = true;
        }
    });
    if (!hasStock) warehouseSelect.innerHTML = '<option value="">هیچ انباری با موجودی پیدا نشد</option>';
}

function updateCurrentStock() {
    const productId = document.getElementById('consumptionProduct').value;
    const warehouseId = document.getElementById('consumptionWarehouse').value;
    if (productId && warehouseId) {
        let item = inventory.find(i => i.productId == productId && i.warehouseId == warehouseId);
        document.getElementById('currentStock').value = item ? formatNumber(item.quantity) : '۰';
    }
}

function updateTransferWarehouses() {
    const productId = document.getElementById('transferProduct').value;
    const fromSelect = document.getElementById('transferFromWarehouse');
    if (!productId) {
        fromSelect.innerHTML = '<option value="">ابتدا کالا را انتخاب کنید</option>';
        return;
    }
    fromSelect.innerHTML = '<option value="">انتخاب کنید</option>';
    warehouses.forEach(warehouse => {
        let item = inventory.find(i => i.productId == productId && i.warehouseId === warehouse.id);
        if (item && item.quantity > 0) {
            fromSelect.innerHTML += `<option value="${warehouse.id}">${warehouse.name} (موجودی: ${formatNumber(item.quantity)})</option>`;
        }
    });
}

function updateTransferStock() {
    const productId = document.getElementById('transferProduct').value;
    const fromWarehouse = document.getElementById('transferFromWarehouse').value;
    if (productId && fromWarehouse) {
        let item = inventory.find(i => i.productId == productId && i.warehouseId == fromWarehouse);
        document.getElementById('transferFromStock').value = item ? formatNumber(item.quantity) : '۰';
    }
}

// ==================== عملیات اصلی ====================

function registerPurchase() {
    if (!hasPermission('can_purchase')) {
        showToast('شما دسترسی ثبت ورود کالا را ندارید');
        return;
    }
    
    const productId = parseInt(document.getElementById('purchaseProduct').value);
    const warehouseId = parseInt(document.getElementById('purchaseWarehouse').value);
    const quantity = parseFloat(toEnglishNumbers(document.getElementById('purchaseQuantity').value));
    const priceInput = toEnglishNumbers(document.getElementById('purchasePrice').value.replace(/,/g, ''));
    const price = priceInput ? roundToTwoDecimals(parseFloat(priceInput)) : null;
    const date = toPersianNumbers(document.getElementById('purchaseDate').value) || DEFAULT_PERSIAN_DATE;
    const desc = document.getElementById('purchaseDesc').value;

    if (!productId || !warehouseId || !quantity) {
        showToast('لطفاً همه فیلدهای ضروری را پر کنید');
        return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    let inventoryItem = inventory.find(item => item.productId === productId && item.warehouseId === warehouseId);
    if (inventoryItem) {
        inventoryItem.quantity += quantity;
    } else {
        inventory.push({ id: inventory.length + 1, productId: productId, warehouseId: warehouseId, quantity: quantity });
    }

    if (price && price > 0) product.price = price;

    transactions.push({
        id: transactions.length + 1,
        type: 'purchase',
        productId: productId,
        fromWarehouse: null,
        toWarehouse: warehouseId,
        quantity: roundToTwoDecimals(quantity),
        price: price || product.price,
        date: date,
        description: desc,
        timestamp: new Date().toISOString()
    });

    showToast('ورود کالا با موفقیت ثبت شد');
    
    document.getElementById('purchaseProduct').value = '';
    document.getElementById('purchaseWarehouse').value = '';
    document.getElementById('purchaseQuantity').value = '';
    document.getElementById('purchasePrice').value = '';
    document.getElementById('purchaseDesc').value = '';

    filterInventory();
    renderProducts();
    renderPurchaseHistory();
    autoSave();
}

function registerConsumption() {
    if (!hasPermission('can_consumption')) {
        showToast('شما دسترسی ثبت خروج کالا را ندارید');
        return;
    }
    
    const productId = parseInt(document.getElementById('consumptionProduct').value);
    const warehouseId = parseInt(document.getElementById('consumptionWarehouse').value);
    let quantity = parseFloat(toEnglishNumbers(document.getElementById('consumptionQuantity').value));
    const date = toPersianNumbers(document.getElementById('consumptionDate').value) || DEFAULT_PERSIAN_DATE;
    const reason = document.getElementById('consumptionReason').value;
    const desc = document.getElementById('consumptionDesc').value;

    if (!productId || !warehouseId || !quantity) {
        showToast('لطفاً همه فیلدهای ضروری را پر کنید');
        return;
    }

    let inventoryItem = inventory.find(item => item.productId === productId && item.warehouseId === warehouseId);
    if (!inventoryItem) {
        showToast('کالا در این انبار موجود نیست');
        return;
    }

    const epsilon = 0.000001;
    if (inventoryItem.quantity < quantity - epsilon) {
        showToast(`موجودی کافی نیست (موجودی: ${formatNumber(inventoryItem.quantity)})`);
        return;
    }
    
    if (Math.abs(inventoryItem.quantity - quantity) < epsilon) quantity = inventoryItem.quantity;

    inventoryItem.quantity = roundToTwoDecimals(inventoryItem.quantity - quantity);

    transactions.push({
        id: transactions.length + 1,
        type: 'consumption',
        productId: productId,
        fromWarehouse: warehouseId,
        toWarehouse: null,
        quantity: roundToTwoDecimals(quantity),
        reason: reason,
        price: products.find(p => p.id === productId).price,
        date: date,
        description: desc,
        timestamp: new Date().toISOString()
    });

    showToast('خروج کالا با موفقیت ثبت شد');
    
    document.getElementById('consumptionProduct').value = '';
    document.getElementById('consumptionWarehouse').value = '';
    document.getElementById('consumptionQuantity').value = '';
    document.getElementById('currentStock').value = '';
    document.getElementById('consumptionDesc').value = '';

    filterInventory();
    renderProducts();
    renderConsumptionHistory();
    autoSave();
}

function renderPurchaseHistory() {
    const tbody = document.getElementById('purchaseHistory');
    if (!tbody) return;

    let purchaseTransactions = transactions.filter(t => t.type === 'purchase');
    
    const sortCol = sortState.purchase.column;
    const sortDir = sortState.purchase.direction;
    purchaseTransactions.sort((a, b) => {
        let valA, valB;
        switch(sortCol) {
            case 'date': valA = getNumericDate(a.date); valB = getNumericDate(b.date); break;
            case 'product': return sortDir === 'asc' ? (products.find(p => p.id === a.productId)?.name || '').localeCompare(products.find(p => p.id === b.productId)?.name || '') : (products.find(p => p.id === b.productId)?.name || '').localeCompare(products.find(p => p.id === a.productId)?.name || '');
            case 'warehouse': return sortDir === 'asc' ? (warehouses.find(w => w.id === a.toWarehouse)?.name || '').localeCompare(warehouses.find(w => w.id === b.toWarehouse)?.name || '') : (warehouses.find(w => w.id === b.toWarehouse)?.name || '').localeCompare(warehouses.find(w => w.id === a.toWarehouse)?.name || '');
            case 'quantity': valA = a.quantity; valB = b.quantity; break;
            case 'price': valA = a.price; valB = b.price; break;
            default: valA = a.id; valB = b.id;
        }
        if (typeof valA === 'string' && typeof valB === 'string') {
            return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            return sortDir === 'asc' ? valA - valB : valB - valA;
        }
    });

    const totalItems = purchaseTransactions.length;
    renderPagination('purchase', totalItems);
    const start = (paginationState.purchase.page - 1) * ITEMS_PER_PAGE;
    const end = Math.min(start + ITEMS_PER_PAGE, totalItems);
    
    const canEdit = hasPermission('can_edit_product');
    const canViewPrices = hasPermission('can_view_prices');
    
    let html = '';
    for (let i = start; i < end; i++) {
        const t = purchaseTransactions[i];
        const product = products.find(p => p.id === t.productId);
        const warehouse = warehouses.find(w => w.id === t.toWarehouse);
        const quantityWithUnit = product ? `${formatNumber(t.quantity)} ${product.unit}` : formatNumber(t.quantity);
        
        html += `<tr>
            <td>${toPersianNumbers((i + 1).toString())}</td>
            <td>${t.date || DEFAULT_PERSIAN_DATE}</td>
            <td>${product ? product.name : ''}</td>
            <td>${warehouse ? warehouse.name : ''}</td>
            <td>${quantityWithUnit}</td>
            ${canViewPrices ? `<td class="price-column">${formatPrice(t.price)}</td>` : '<td class="price-column hidden"></td>'}
            <td>${t.description || '—'}</td>
            ${canEdit ? `<td class="action-column">
                <button class="btn btn-gold" onclick="editTransaction(${t.id})" title="ویرایش">✏️</button>
                <button class="btn btn-danger" onclick="deleteTransaction(${t.id})" title="حذف">🗑️</button>
            </td>` : '<td class="action-column hidden"></td>'}
        </tr>`;
    }
    tbody.innerHTML = html || '<tr><td colspan="8" style="text-align: center;">هیچ ورودی ثبت نشده</td></tr>';
}

function renderConsumptionHistory() {
    const tbody = document.getElementById('consumptionHistory');
    if (!tbody) return;

    let consumptionTransactions = transactions.filter(t => t.type === 'consumption');
    
    const sortCol = sortState.consumption.column;
    const sortDir = sortState.consumption.direction;
    consumptionTransactions.sort((a, b) => {
        let valA, valB;
        switch(sortCol) {
            case 'date': valA = getNumericDate(a.date); valB = getNumericDate(b.date); break;
            case 'product': return sortDir === 'asc' ? (products.find(p => p.id === a.productId)?.name || '').localeCompare(products.find(p => p.id === b.productId)?.name || '') : (products.find(p => p.id === b.productId)?.name || '').localeCompare(products.find(p => p.id === a.productId)?.name || '');
            case 'warehouse': return sortDir === 'asc' ? (warehouses.find(w => w.id === a.fromWarehouse)?.name || '').localeCompare(warehouses.find(w => w.id === b.fromWarehouse)?.name || '') : (warehouses.find(w => w.id === b.fromWarehouse)?.name || '').localeCompare(warehouses.find(w => w.id === a.fromWarehouse)?.name || '');
            case 'quantity': valA = a.quantity; valB = b.quantity; break;
            case 'reason': valA = a.reason || ''; valB = b.reason || ''; break;
            default: valA = a.id; valB = b.id;
        }
        if (typeof valA === 'string' && typeof valB === 'string') {
            return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            return sortDir === 'asc' ? valA - valB : valB - valA;
        }
    });

    const totalItems = consumptionTransactions.length;
    renderPagination('consumption', totalItems);
    const start = (paginationState.consumption.page - 1) * ITEMS_PER_PAGE;
    const end = Math.min(start + ITEMS_PER_PAGE, totalItems);
    
    const canEdit = hasPermission('can_edit_product');
    
    let html = '';
    for (let i = start; i < end; i++) {
        const t = consumptionTransactions[i];
        const product = products.find(p => p.id === t.productId);
        const warehouse = warehouses.find(w => w.id === t.fromWarehouse);
        const quantityWithUnit = product ? `${formatNumber(t.quantity)} ${product.unit}` : formatNumber(t.quantity);
        
        html += `<tr>
            <td>${toPersianNumbers((i + 1).toString())}</td>
            <td>${t.date || DEFAULT_PERSIAN_DATE}</td>
            <td>${product ? product.name : ''}</td>
            <td>${warehouse ? warehouse.name : ''}</td>
            <td>${quantityWithUnit}</td>
            <td>${t.reason || 'مصرف'}</td>
            <td>${t.description || '—'}</td>
            ${canEdit ? `<td class="action-column">
                <button class="btn btn-gold" onclick="editTransaction(${t.id})" title="ویرایش">✏️</button>
                <button class="btn btn-danger" onclick="deleteTransaction(${t.id})" title="حذف">🗑️</button>
            </td>` : '<td class="action-column hidden"></td>'}
        </tr>`;
    }
    tbody.innerHTML = html || '<tr><td colspan="8" style="text-align: center;">هیچ خروجی ثبت نشده<td></td>';
}

// ادامه فایل js/app.js

// ==================== ویرایش و حذف تراکنش ====================

function editTransaction(transactionId) {
    if (!hasPermission('can_edit_product')) {
        showToast('شما دسترسی ویرایش تراکنش را ندارید');
        return;
    }
    
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    document.getElementById('editTransactionId').value = transaction.id;
    document.getElementById('editTransactionType').value = transaction.type;
    document.getElementById('editTransactionProduct').value = transaction.productId;
    document.getElementById('editTransactionWarehouse').value = transaction.type === 'purchase' ? transaction.toWarehouse : transaction.fromWarehouse;
    document.getElementById('editTransactionQuantity').value = transaction.quantity;
    document.getElementById('editTransactionDate').value = transaction.date || DEFAULT_PERSIAN_DATE;
    document.getElementById('editTransactionDescription').value = transaction.description || '';
    
    if (transaction.type === 'purchase') {
        document.getElementById('editReasonGroup').style.display = 'none';
        document.getElementById('editPriceGroup').style.display = 'block';
        document.getElementById('editTransactionPrice').value = toPersianNumbers(transaction.price.toLocaleString());
        document.getElementById('editTransactionTitle').innerHTML = '✏️ ویرایش ورود کالا';
    } else {
        document.getElementById('editReasonGroup').style.display = 'block';
        document.getElementById('editPriceGroup').style.display = 'none';
        document.getElementById('editTransactionReason').value = transaction.reason || 'مصرف در رستوران';
        document.getElementById('editTransactionTitle').innerHTML = '✏️ ویرایش خروج کالا';
    }
    
    document.getElementById('editTransactionModal').classList.add('active');
}

function saveTransactionEdit() {
    const transactionId = parseInt(document.getElementById('editTransactionId').value);
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    const newQuantity = roundToTwoDecimals(parseFloat(toEnglishNumbers(document.getElementById('editTransactionQuantity').value)));
    const newDate = toPersianNumbers(document.getElementById('editTransactionDate').value);
    const newDescription = document.getElementById('editTransactionDescription').value;
    
    if (isNaN(newQuantity) || newQuantity <= 0) {
        showToast('لطفاً تعداد معتبر وارد کنید');
        return;
    }
    
    const oldQuantity = transaction.quantity;
    const quantityDiff = newQuantity - oldQuantity;
    
    if (transaction.type === 'purchase') {
        const priceInput = toEnglishNumbers(document.getElementById('editTransactionPrice').value.replace(/,/g, ''));
        const newPrice = priceInput ? roundToTwoDecimals(parseFloat(priceInput)) : transaction.price;
        
        const inventoryItem = inventory.find(item => 
            item.productId === transaction.productId && 
            item.warehouseId === transaction.toWarehouse
        );
        
        if (inventoryItem) inventoryItem.quantity += quantityDiff;
        
        transaction.quantity = newQuantity;
        transaction.price = newPrice;
        transaction.date = newDate;
        transaction.description = newDescription;
        
        showToast('ورودی با موفقیت ویرایش شد');
        
    } else if (transaction.type === 'consumption') {
        const newReason = document.getElementById('editTransactionReason').value;
        const inventoryItem = inventory.find(item => 
            item.productId === transaction.productId && 
            item.warehouseId === transaction.fromWarehouse
        );
        
        if (inventoryItem) {
            const newStock = inventoryItem.quantity + oldQuantity - newQuantity;
            if (newStock < 0) {
                showToast('موجودی کافی نیست');
                return;
            }
            inventoryItem.quantity = newStock;
        }
        
        transaction.quantity = newQuantity;
        transaction.reason = newReason;
        transaction.date = newDate;
        transaction.description = newDescription;
        
        showToast('خروجی با موفقیت ویرایش شد');
    }
    
    hideModal('editTransactionModal');
    renderPurchaseHistory();
    renderConsumptionHistory();
    filterInventory();
    renderProducts();
    autoSave();
}

function deleteTransaction(transactionId) {
    if (!hasPermission('can_delete')) {
        showToast('شما دسترسی حذف تراکنش را ندارید');
        return;
    }
    
    if (!confirm('آیا از حذف این تراکنش اطمینان دارید؟')) return;
    
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    if (transaction.type === 'purchase') {
        const inventoryItem = inventory.find(item => 
            item.productId === transaction.productId && 
            item.warehouseId === transaction.toWarehouse
        );
        if (inventoryItem) {
            inventoryItem.quantity -= transaction.quantity;
            if (inventoryItem.quantity < 0) inventoryItem.quantity = 0;
        }
    } else if (transaction.type === 'consumption') {
        const inventoryItem = inventory.find(item => 
            item.productId === transaction.productId && 
            item.warehouseId === transaction.fromWarehouse
        );
        if (inventoryItem) inventoryItem.quantity += transaction.quantity;
    }
    
    transactions = transactions.filter(t => t.id !== transactionId);
    
    showToast('تراکنش با موفقیت حذف شد');
    renderPurchaseHistory();
    renderConsumptionHistory();
    filterInventory();
    renderProducts();
    autoSave();
}

// ==================== انتقال کالا ====================

function toggleBulkTransfer() {
    const isBulk = document.getElementById('bulkTransferCheck').checked;
    document.getElementById('singleTransfer').style.display = isBulk ? 'none' : 'block';
    document.getElementById('bulkTransfer').style.display = isBulk ? 'block' : 'none';
    if (isBulk) renderBulkTransfer();
}

function renderBulkTransfer() {
    const tbody = document.getElementById('bulkTransferBody');
    if (!tbody) return;
    
    const fromWarehouse = document.getElementById('bulkFromWarehouse').value;
    if (!fromWarehouse) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">لطفاً انبار مبدأ را انتخاب کنید</td></tr>';
        return;
    }
    
    let html = '';
    let counter = 1;
    
    products.forEach(product => {
        let item = inventory.find(i => i.productId === product.id && i.warehouseId == fromWarehouse);
        if (item && item.quantity > 0) {
            html += `<tr>
                <td><input type="checkbox" class="bulk-checkbox" data-product-id="${product.id}"></td>
                <td>${toPersianNumbers(counter.toString())}</td>
                <td>${product.name}</td>
                <td>${product.unit}</td>
                <td>${formatNumber(item.quantity)}</td>
                <td><input type="number" class="bulk-quantity" data-product-id="${product.id}" 
                    min="1" max="${item.quantity}" value="${item.quantity}" step="0.01" style="width: 80px;" onchange="validateBulkQuantity(this)"></td>
                </tr>`;
            counter++;
        }
    });
    
    if (counter === 1) html = '</table><td colspan="6" style="text-align: center;">هیچ کالایی در این انبار وجود ندارد</td></tr>';
    tbody.innerHTML = html;
}

function validateBulkQuantity(input) {
    const max = parseFloat(input.max);
    const value = parseFloat(input.value);
    if (value > max) input.value = max;
    if (value < 0) input.value = 0;
}

function selectAllBulk(select) {
    document.querySelectorAll('.bulk-checkbox').forEach(cb => cb.checked = select);
    document.getElementById('selectAllBulk').checked = select;
}

function setMaxQuantityForSelected() {
    document.querySelectorAll('.bulk-checkbox:checked').forEach(cb => {
        const productId = cb.dataset.productId;
        const quantityInput = document.querySelector(`.bulk-quantity[data-product-id="${productId}"]`);
        if (quantityInput) quantityInput.value = quantityInput.max;
    });
    showToast('حداکثر تعداد برای کالاهای انتخاب شده تنظیم شد');
}

function toggleSelectAll() {
    const isChecked = document.getElementById('selectAllBulk').checked;
    document.querySelectorAll('.bulk-checkbox').forEach(cb => cb.checked = isChecked);
}

function registerBulkTransfer() {
    if (!hasPermission('can_transfer')) {
        showToast('شما دسترسی ثبت انتقال را ندارید');
        return;
    }
    
    const fromWarehouse = parseInt(document.getElementById('bulkFromWarehouse').value);
    const toWarehouse = parseInt(document.getElementById('bulkToWarehouse').value);
    const date = toPersianNumbers(document.getElementById('bulkTransferDate').value) || DEFAULT_PERSIAN_DATE;
    
    if (!fromWarehouse || !toWarehouse) {
        showToast('لطفاً انبارها را انتخاب کنید');
        return;
    }
    if (fromWarehouse === toWarehouse) {
        showToast('انبار مبدأ و مقصد نمی‌توانند یکسان باشند');
        return;
    }
    
    let transferred = 0;
    const epsilon = 0.000001;
    
    document.querySelectorAll('.bulk-checkbox:checked').forEach(cb => {
        const productId = parseInt(cb.dataset.productId);
        const quantityInput = document.querySelector(`.bulk-quantity[data-product-id="${productId}"]`);
        let quantity = roundToTwoDecimals(parseFloat(quantityInput.value));
        
        if (quantity > 0) {
            let fromItem = inventory.find(item => item.productId === productId && item.warehouseId === fromWarehouse);
            if (fromItem && fromItem.quantity > 0) {
                if (fromItem.quantity < quantity - epsilon) return;
                if (Math.abs(fromItem.quantity - quantity) < epsilon) quantity = fromItem.quantity;
                
                fromItem.quantity = roundToTwoDecimals(fromItem.quantity - quantity);
                
                let toItem = inventory.find(item => item.productId === productId && item.warehouseId === toWarehouse);
                if (toItem) {
                    toItem.quantity = roundToTwoDecimals(toItem.quantity + quantity);
                } else {
                    inventory.push({ id: inventory.length + 1, productId: productId, warehouseId: toWarehouse, quantity: quantity });
                }
                
                transactions.push({
                    id: transactions.length + 1,
                    type: 'transfer',
                    productId: productId,
                    fromWarehouse: fromWarehouse,
                    toWarehouse: toWarehouse,
                    quantity: quantity,
                    date: date,
                    timestamp: new Date().toISOString()
                });
                transferred++;
            }
        }
    });
    
    if (transferred > 0) {
        showToast(`${toPersianNumbers(transferred.toString())} کالا با موفقیت منتقل شد`);
        renderBulkTransfer();
        filterInventory();
        renderProducts();
        autoSave();
    } else {
        showToast('هیچ کالایی برای انتقال انتخاب نشده یا موجودی کافی نیست');
    }
}

function registerTransfer() {
    if (!hasPermission('can_transfer')) {
        showToast('شما دسترسی ثبت انتقال را ندارید');
        return;
    }
    
    const productId = parseInt(document.getElementById('transferProduct').value);
    const fromWarehouse = parseInt(document.getElementById('transferFromWarehouse').value);
    const toWarehouse = parseInt(document.getElementById('transferToWarehouse').value);
    let quantity = roundToTwoDecimals(parseFloat(toEnglishNumbers(document.getElementById('transferQuantity').value)));
    const date = toPersianNumbers(document.getElementById('transferDate').value) || DEFAULT_PERSIAN_DATE;
    
    if (!productId || !fromWarehouse || !toWarehouse || !quantity) {
        showToast('لطفاً همه فیلدها را پر کنید');
        return;
    }
    if (fromWarehouse === toWarehouse) {
        showToast('انبار مبدأ و مقصد نمی‌توانند یکسان باشند');
        return;
    }
    
    let fromItem = inventory.find(item => item.productId === productId && item.warehouseId === fromWarehouse);
    if (!fromItem) {
        showToast('کالا در انبار مبدأ موجود نیست');
        return;
    }
    
    const epsilon = 0.000001;
    if (fromItem.quantity < quantity - epsilon) {
        showToast(`موجودی در انبار مبدأ کافی نیست (موجودی: ${formatNumber(fromItem.quantity)})`);
        return;
    }
    if (Math.abs(fromItem.quantity - quantity) < epsilon) quantity = fromItem.quantity;
    
    fromItem.quantity = roundToTwoDecimals(fromItem.quantity - quantity);
    
    let toItem = inventory.find(item => item.productId === productId && item.warehouseId === toWarehouse);
    if (toItem) {
        toItem.quantity = roundToTwoDecimals(toItem.quantity + quantity);
    } else {
        inventory.push({ id: inventory.length + 1, productId: productId, warehouseId: toWarehouse, quantity: quantity });
    }
    
    transactions.push({
        id: transactions.length + 1,
        type: 'transfer',
        productId: productId,
        fromWarehouse: fromWarehouse,
        toWarehouse: toWarehouse,
        quantity: quantity,
        date: date,
        timestamp: new Date().toISOString()
    });
    
    showToast('انتقال با موفقیت انجام شد');
    
    document.getElementById('transferProduct').value = '';
    document.getElementById('transferFromWarehouse').value = '';
    document.getElementById('transferToWarehouse').value = '';
    document.getElementById('transferQuantity').value = '';
    document.getElementById('transferFromStock').value = '';
    
    filterInventory();
    renderProducts();
    autoSave();
}

// ==================== منوی راست کلیک ====================

function showContextMenu(event, productId) {
    event.preventDefault();
    selectedProductId = productId;
    const menu = document.getElementById('contextMenu');
    menu.style.display = 'block';
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    document.addEventListener('click', function closeMenu() {
        menu.style.display = 'none';
        document.removeEventListener('click', closeMenu);
    });
}

function showProductHistory() {
    if (selectedProductId) showProductHistoryById(selectedProductId);
    document.getElementById('contextMenu').style.display = 'none';
}

function showProductHistoryById(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('historyProductTitle').innerHTML = `📋 تاریخچه کالا: ${product.name}`;
    
    let currentStock = inventory.filter(item => item.productId === productId).reduce((sum, item) => sum + item.quantity, 0);
    let totalIn = transactions.filter(t => t.productId === productId && t.type === 'purchase').reduce((sum, t) => sum + t.quantity, 0);
    let totalOut = transactions.filter(t => t.productId === productId && t.type === 'consumption').reduce((sum, t) => sum + t.quantity, 0);
    
    document.getElementById('historyCurrentStock').innerHTML = formatNumber(currentStock);
    document.getElementById('historyTotalIn').innerHTML = formatNumber(totalIn);
    document.getElementById('historyTotalOut').innerHTML = formatNumber(totalOut);
    
    const productTransactions = transactions.filter(t => t.productId === productId).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    
    let historyHtml = '';
    if (productTransactions.length === 0) {
        historyHtml = '<p style="text-align: center; color: #666;">هیچ تراکنشی برای این کالا ثبت نشده است</p>';
    } else {
        productTransactions.forEach(t => {
            let typeClass = '', typeText = '';
            switch(t.type) {
                case 'purchase': typeClass = 'purchase'; typeText = 'ورود به انبار'; break;
                case 'consumption': typeClass = 'consumption'; typeText = 'خروج از انبار'; break;
                case 'transfer': typeClass = 'transfer'; typeText = 'انتقال بین انبار'; break;
            }
            
            let details = '';
            if (t.type === 'purchase') {
                let warehouse = warehouses.find(w => w.id === t.toWarehouse);
                details = `انبار مقصد: ${warehouse ? warehouse.name : ''} - قیمت: ${formatPrice(t.price)}`;
            } else if (t.type === 'consumption') {
                let warehouse = warehouses.find(w => w.id === t.fromWarehouse);
                details = `انبار مبدأ: ${warehouse ? warehouse.name : ''} - دلیل: ${t.reason || 'مصرف'}`;
            } else if (t.type === 'transfer') {
                let fromWh = warehouses.find(w => w.id === t.fromWarehouse);
                let toWh = warehouses.find(w => w.id === t.toWarehouse);
                details = `از: ${fromWh ? fromWh.name : ''} به: ${toWh ? toWh.name : ''}`;
            }
            
            historyHtml += `<div class="history-item ${typeClass}">
                <div class="history-date">${t.date || DEFAULT_PERSIAN_DATE}</div>
                <div class="history-title">${typeText} - تعداد: ${formatNumber(t.quantity)}</div>
                <div class="history-details">${details} ${t.description ? ' - ' + t.description : ''}</div>
            </div>`;
        });
    }
    
    document.getElementById('historyTimeline').innerHTML = historyHtml;
    document.getElementById('productHistoryModal').classList.add('active');
}

function showProductDetails() {
    if (selectedProductId) {
        const product = products.find(p => p.id === selectedProductId);
        if (product) {
            const canViewPrices = hasPermission('can_view_prices');
            alert(`کالا: ${product.name}\nواحد: ${product.unit}${canViewPrices ? `\nقیمت: ${formatPrice(product.price)}` : ''}`);
        }
    }
    document.getElementById('contextMenu').style.display = 'none';
}

function showProductMovements() {
    if (selectedProductId) {
        document.querySelector('[data-page="reports"]').click();
        document.getElementById('movementProduct').value = selectedProductId;
        generateMovementReport();
    }
    document.getElementById('contextMenu').style.display = 'none';
}

function exportProductHistory() {
    if (selectedProductId) exportToExcel('تاریخچه کالا');
}

// ==================== گزارش‌ها ====================

function showReportTab(tab) {
    document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.report-content').forEach(c => c.style.display = 'none');
    event.target.classList.add('active');
    
    if (tab === 'movement') {
        document.getElementById('movementReport').style.display = 'block';
        generateMovementReport();
    } else if (tab === 'warehouse') {
        document.getElementById('warehouseReport').style.display = 'block';
        generateWarehouseReport();
    } else if (tab === 'lowstock') {
        document.getElementById('lowstockReport').style.display = 'block';
        generateLowStockReport();
    } else if (tab === 'value') {
        document.getElementById('valueReport').style.display = 'block';
        generateValueReport();
    }
}

function generateMovementReport() {
    const fromDate = toPersianNumbers(document.getElementById('movementFromDate').value);
    const toDate = toPersianNumbers(document.getElementById('movementToDate').value);
    const productId = document.getElementById('movementProduct').value;
    const type = document.getElementById('movementType').value;
    
    let filteredTransactions = transactions.filter(t => {
        if (type !== 'all' && t.type !== type) return false;
        if (productId && t.productId != productId) return false;
        if (!isDateInRange(t.date, fromDate, toDate)) return false;
        return true;
    });
    
    const sortCol = sortState.movement.column;
    const sortDir = sortState.movement.direction;
    filteredTransactions.sort((a, b) => {
        let valA, valB;
        switch(sortCol) {
            case 'date': valA = getNumericDate(a.date); valB = getNumericDate(b.date); break;
            case 'product': return sortDir === 'asc' ? (products.find(p => p.id === a.productId)?.name || '').localeCompare(products.find(p => p.id === b.productId)?.name || '') : (products.find(p => p.id === b.productId)?.name || '').localeCompare(products.find(p => p.id === a.productId)?.name || '');
            case 'type': valA = a.type || ''; valB = b.type || ''; break;
            default: valA = a.id; valB = b.id;
        }
        if (typeof valA === 'string' && typeof valB === 'string') {
            return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            return sortDir === 'asc' ? valA - valB : valB - valA;
        }
    });
    
    const tbody = document.getElementById('movementBody');
    const canEdit = hasPermission('can_edit_product');
    const canViewPrices = hasPermission('can_view_prices');
    let html = '';
    
    if (filteredTransactions.length === 0) {
        html = '<tr><td colspan="10" style="text-align: center;">هیچ تراکنشی یافت نشد</td></tr>';
    } else {
        filteredTransactions.slice().reverse().forEach((t, index) => {
            const product = products.find(p => p.id === t.productId);
            const fromWh = t.fromWarehouse ? warehouses.find(w => w.id === t.fromWarehouse) : null;
            const toWh = t.toWarehouse ? warehouses.find(w => w.id === t.toWarehouse) : null;
            
            let typeText = '', typeIcon = '';
            switch(t.type) {
                case 'purchase': typeText = 'ورود'; typeIcon = '🟢'; break;
                case 'consumption': typeText = 'خروج'; typeIcon = '🔴'; break;
                case 'transfer': typeText = 'انتقال'; typeIcon = '🟡'; break;
            }
            
            html += `<tr>
                <td>${toPersianNumbers((index + 1).toString())}</td>
                <td>${t.date || DEFAULT_PERSIAN_DATE}</td>
                <td>${product ? product.name : ''}</td>
                <td>${typeIcon} ${typeText}</td>
                <td>${fromWh ? fromWh.name : '—'}</td>
                <td>${toWh ? toWh.name : '—'}</td>
                <td>${formatNumber(t.quantity)}</td>
                ${canViewPrices ? `<td class="price-column">${t.price ? formatPrice(t.price) : '—'}</td>` : '<td class="price-column hidden">—</td>'}
                <td>${t.description || t.reason || '—'}</td>
                ${canEdit ? `<td class="action-column">
                    <button class="btn btn-gold" onclick="editTransaction(${t.id})" title="ویرایش">✏️</button>
                    <button class="btn btn-danger" onclick="deleteTransaction(${t.id})" title="حذف">🗑️</button>
                </td>` : '<td class="action-column hidden"></td>'}
            </tr>`;
        });
    }
    tbody.innerHTML = html;
}

function generateWarehouseReport() {
    const reportDiv = document.getElementById('warehouseReport');
    let html = '<div style="overflow-x: auto;"><table class="inventory-table"><thead><tr><th>انبار</th><th>تعداد کالا</th><th>کالاهای پرمصرف</th></tr></thead><tbody>';
    
    warehouses.forEach(warehouse => {
        let itemCount = 0;
        let items = [];
        
        inventory.forEach(item => {
            if (item.warehouseId === warehouse.id && item.quantity > 0) {
                itemCount++;
                let product = products.find(p => p.id === item.productId);
                if (product) items.push({name: product.name, qty: item.quantity});
            }
        });
        
        items.sort((a, b) => b.qty - a.qty);
        let topItems = items.slice(0, 3).map(i => `${i.name} (${formatNumber(i.qty)})`).join('<br>');
        
        html += `<tr>
            <td>${warehouse.name}</td>
            <td>${toPersianNumbers(itemCount.toString())}</td>
            <td>${topItems || '—'}</td>
        </tr>`;
    });
    
    html += '</tbody></table></div>';
    reportDiv.innerHTML = html;
}

function generateLowStockReport() {
    const reportDiv = document.getElementById('lowstockReport');
    let html = '<div style="overflow-x: auto;"><table class="inventory-table"><thead><tr><th>کالا</th><th>واحد</th><th>موجودی کل</th><th>انبارها</th><th>وضعیت</th></tr></thead><tbody>';
    
    products.forEach(product => {
        let totalQty = inventory.filter(item => item.productId === product.id).reduce((sum, item) => sum + item.quantity, 0);
        if (totalQty < 20) {
            let warehouseInfo = [];
            inventory.forEach(item => {
                if (item.productId === product.id && item.quantity > 0) {
                    let warehouse = warehouses.find(w => w.id === item.warehouseId);
                    warehouseInfo.push(`${warehouse?.name}: ${formatNumber(item.quantity)}`);
                }
            });
            
            let status = totalQty < 5 ? '⚠️ بحرانی' : '⚡ کم‌موجود';
            let statusColor = totalQty < 5 ? 'red' : 'orange';
            
            html += `<tr>
                <td>${product.name}</td>
                <td>${product.unit}</td>
                <td style="color: ${statusColor}; font-weight: bold;">${formatNumber(totalQty)}</td>
                <td>${warehouseInfo.join('<br>') || '—'}</td>
                <td>${status}</td>
            </tr>`;
        }
    });
    
    html += '</tbody></table></div>';
    reportDiv.innerHTML = html;
}

function generateValueReport() {
    if (!hasPermission('can_view_prices')) {
        document.getElementById('valueReport').innerHTML = '<p style="text-align: center; color: #666;">شما دسترسی مشاهده گزارش ارزش موجودی را ندارید</p>';
        return;
    }
    
    const reportDiv = document.getElementById('valueReport');
    let totalValue = 0;
    let html = '<div style="overflow-x: auto;"><table class="inventory-table"><thead><tr><th>کالا</th><th>واحد</th><th>قیمت واحد</th><th>موجودی</th><th>ارزش</th></tr></thead><tbody>';
    
    products.forEach(product => {
        let totalQty = inventory.filter(item => item.productId === product.id).reduce((sum, item) => sum + item.quantity, 0);
        if (totalQty > 0) {
            let value = totalQty * product.price;
            totalValue += value;
            
            html += `<tr>
                <td>${product.name}</td>
                <td>${product.unit}</td>
                <td>${formatPrice(product.price)}</td>
                <td>${formatNumber(totalQty)}</td>
                <td>${formatPrice(value)}</td>
            </tr>`;
        }
    });
    
    html += `</tbody><tfoot><tr style="background: var(--soft-gold); font-weight: bold;">
        <td colspan="4">جمع کل:</td>
        <td>${formatPrice(totalValue)}</td>
    </tr></tfoot></table></div>`;
    
    reportDiv.innerHTML = html;
}

// ==================== مدیریت کاربران ====================

function showAddUserModal() {
    if (!hasPermission('can_manage_users')) {
        showToast('شما دسترسی مدیریت کاربران را ندارید');
        return;
    }
    
    document.getElementById('userModalTitle').innerHTML = '➕ افزودن کاربر جدید';
    document.getElementById('editUserId').value = '';
    document.getElementById('userUsername').value = '';
    document.getElementById('userPassword').value = '';
    document.getElementById('userDisplayName').value = '';
    document.getElementById('userRole').value = 'junior_keeper';
    document.getElementById('userModal').classList.add('active');
}

function editUser(userId) {
    if (!hasPermission('can_manage_users')) {
        showToast('شما دسترسی مدیریت کاربران را ندارید');
        return;
    }
    
    const users = loadUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
        document.getElementById('userModalTitle').innerHTML = `✏️ ویرایش کاربر: ${user.username}`;
        document.getElementById('editUserId').value = user.id;
        document.getElementById('userUsername').value = user.username;
        document.getElementById('userPassword').value = '';
        document.getElementById('userDisplayName').value = user.displayName;
        document.getElementById('userRole').value = user.role;
        document.getElementById('userModal').classList.add('active');
    }
}

function saveUser() {
    if (!hasPermission('can_manage_users')) {
        showToast('شما دسترسی مدیریت کاربران را ندارید');
        return;
    }
    
    const userId = document.getElementById('editUserId').value;
    const username = document.getElementById('userUsername').value.trim();
    const password = document.getElementById('userPassword').value;
    const displayName = document.getElementById('userDisplayName').value.trim();
    const role = document.getElementById('userRole').value;
    
    if (!username) {
        showToast('لطفاً نام کاربری را وارد کنید');
        return;
    }
    
    let users = loadUsers();
    
    if (userId) {
        // ویرایش
        const index = users.findIndex(u => u.id == userId);
        if (index !== -1) {
            users[index].username = username;
            if (password) users[index].password = password;
            users[index].displayName = displayName;
            users[index].role = role;
            showToast('کاربر با موفقیت ویرایش شد');
        }
    } else {
        // افزودن جدید
        if (!password) {
            showToast('لطفاً رمز عبور را وارد کنید');
            return;
        }
        if (users.find(u => u.username === username)) {
            showToast('نام کاربری تکراری است');
            return;
        }
        users.push({
            id: users.length + 1,
            username: username,
            password: password,
            displayName: displayName || username,
            role: role,
            lastLogin: null
        });
        showToast('کاربر با موفقیت اضافه شد');
    }
    
    saveUsers(users);
    renderUsersList();
    hideModal('userModal');
}

function deleteUser(userId) {
    if (!hasPermission('can_manage_users')) {
        showToast('شما دسترسی مدیریت کاربران را ندارید');
        return;
    }
    
    if (userId === currentUser?.id) {
        showToast('نمی‌توانید خودتان را حذف کنید');
        return;
    }
    
    if (confirm('آیا از حذف این کاربر اطمینان دارید؟')) {
        let users = loadUsers();
        users = users.filter(u => u.id !== userId);
        saveUsers(users);
        renderUsersList();
        showToast('کاربر با موفقیت حذف شد');
    }
}

function renderUsersList() {
    const tbody = document.getElementById('usersBody');
    if (!tbody) return;
    
    const users = loadUsers();
    let html = '';
    
    users.forEach((user, index) => {
        html += `<tr>
            <td>${toPersianNumbers((index + 1).toString())}</td>
            <td>${user.username}</td>
            <td>${getRolePersian(user.role)}</td>
            <td>${user.displayName}</td>
            <td>${user.lastLogin || '—'}</td>
            <td class="action-column">
                <button class="btn btn-gold" style="padding: 4px 8px;" onclick="editUser(${user.id})">✏️</button>
                ${user.id !== currentUser?.id ? `<button class="btn btn-danger" style="padding: 4px 8px;" onclick="deleteUser(${user.id})">🗑️</button>` : ''}
            </td>
        </tr>`;
    });
    
    tbody.innerHTML = html;
}

// ==================== مدیریت کالاها ====================

function showAddProductModal() {
    if (!hasPermission('can_edit_product')) {
        showToast('شما دسترسی افزودن کالا را ندارید');
        return;
    }
    
    document.getElementById('productName').value = '';
    document.getElementById('productUnit').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productInitialStock').value = '0';
    document.getElementById('newProductFields').style.display = 'block';
    document.getElementById('editInventoryFields').style.display = 'none';
    document.getElementById('productModalTitle').innerHTML = '➕ افزودن کالای جدید';
    delete document.getElementById('productModal').dataset.editId;
    currentEditProductId = null;
    document.getElementById('productModal').classList.add('active');
}

function editProduct(id) {
    if (!hasPermission('can_edit_product')) {
        showToast('شما دسترسی ویرایش کالا را ندارید');
        return;
    }
    
    const product = products.find(p => p.id === id);
    if (product) {
        currentEditProductId = id;
        document.getElementById('productModal').dataset.editId = id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productUnit').value = product.unit;
        document.getElementById('productPrice').value = toPersianNumbers(product.price.toLocaleString());
        document.getElementById('newProductFields').style.display = 'none';
        document.getElementById('editInventoryFields').style.display = 'block';
        
        const warehouseSelect = document.getElementById('editWarehouseSelect');
        warehouseSelect.innerHTML = '<option value="">انتخاب کنید</option>';
        warehouses.forEach(warehouse => {
            let item = inventory.find(i => i.productId === id && i.warehouseId === warehouse.id);
            let stockText = item ? ` (موجودی: ${formatNumber(item.quantity)})` : ' (موجودی: ۰)';
            warehouseSelect.innerHTML += `<option value="${warehouse.id}">${warehouse.name}${stockText}</option>`;
        });
        
        document.getElementById('currentWarehouseStock').value = '';
        document.getElementById('editQuantity').value = '';
        document.getElementById('editDescription').value = '';
        document.getElementById('editDate').value = DEFAULT_PERSIAN_DATE;
        document.getElementById('productModalTitle').innerHTML = `✏️ ویرایش کالا: ${product.name}`;
        document.getElementById('productModal').classList.add('active');
    }
}

function loadWarehouseStock() {
    const warehouseId = document.getElementById('editWarehouseSelect').value;
    if (!warehouseId || !currentEditProductId) return;
    let item = inventory.find(i => i.productId === currentEditProductId && i.warehouseId == warehouseId);
    document.getElementById('currentWarehouseStock').value = item ? formatNumber(item.quantity) : '۰';
    document.getElementById('editQuantity').value = item ? item.quantity : 0;
}

function updateWarehouseStock() {
    const warehouseId = parseInt(document.getElementById('editWarehouseSelect').value);
    const newQuantity = roundToTwoDecimals(parseFloat(toEnglishNumbers(document.getElementById('editQuantity').value)));
    const date = toPersianNumbers(document.getElementById('editDate').value) || DEFAULT_PERSIAN_DATE;
    const description = document.getElementById('editDescription').value;
    
    if (!warehouseId) {
        showToast('لطفاً انبار را انتخاب کنید');
        return;
    }
    if (isNaN(newQuantity) || newQuantity < 0) {
        showToast('لطفاً تعداد معتبر وارد کنید');
        return;
    }
    if (!currentEditProductId) return;
    
    let item = inventory.find(i => i.productId === currentEditProductId && i.warehouseId === warehouseId);
    let oldQuantity = item ? item.quantity : 0;
    
    if (item) {
        if (newQuantity > oldQuantity) {
            let diff = newQuantity - oldQuantity;
            item.quantity = newQuantity;
            transactions.push({
                id: transactions.length + 1,
                type: 'purchase',
                productId: currentEditProductId,
                fromWarehouse: null,
                toWarehouse: warehouseId,
                quantity: roundToTwoDecimals(diff),
                price: products.find(p => p.id === currentEditProductId).price,
                date: date,
                description: description || 'ویرایش دستی (افزایش)',
                timestamp: new Date().toISOString()
            });
        } else if (newQuantity < oldQuantity) {
            let diff = oldQuantity - newQuantity;
            item.quantity = newQuantity;
            transactions.push({
                id: transactions.length + 1,
                type: 'consumption',
                productId: currentEditProductId,
                fromWarehouse: warehouseId,
                toWarehouse: null,
                quantity: roundToTwoDecimals(diff),
                reason: 'ویرایش دستی',
                date: date,
                description: description || 'ویرایش دستی (کاهش)',
                timestamp: new Date().toISOString()
            });
        }
    } else if (newQuantity > 0) {
        inventory.push({
            id: inventory.length + 1,
            productId: currentEditProductId,
            warehouseId: warehouseId,
            quantity: newQuantity
        });
        transactions.push({
            id: transactions.length + 1,
            type: 'purchase',
            productId: currentEditProductId,
            fromWarehouse: null,
            toWarehouse: warehouseId,
            quantity: newQuantity,
            price: products.find(p => p.id === currentEditProductId).price,
            date: date,
            description: description || 'ایجاد موجودی اولیه',
            timestamp: new Date().toISOString()
        });
    }
    
    showToast('موجودی با موفقیت بروزرسانی شد');
    
    const warehouseSelect = document.getElementById('editWarehouseSelect');
    warehouseSelect.innerHTML = '<option value="">انتخاب کنید</option>';
    warehouses.forEach(warehouse => {
        let item = inventory.find(i => i.productId === currentEditProductId && i.warehouseId === warehouse.id);
        let stockText = item ? ` (موجودی: ${formatNumber(item.quantity)})` : ' (موجودی: ۰)';
        warehouseSelect.innerHTML += `<option value="${warehouse.id}">${warehouse.name}${stockText}</option>`;
    });
    
    renderProducts();
    filterInventory();
    renderPurchaseHistory();
    renderConsumptionHistory();
    autoSave();
}

function saveProduct() {
    const name = document.getElementById('productName').value.trim();
    const unit = document.getElementById('productUnit').value.trim();
    const priceInput = toEnglishNumbers(document.getElementById('productPrice').value.replace(/,/g, ''));
    const price = priceInput ? roundToTwoDecimals(parseFloat(priceInput)) : 0;
    const editId = document.getElementById('productModal').dataset.editId;
    
    if (!name) { showToast('لطفاً عنوان کالا را وارد کنید'); return; }
    if (!unit) { showToast('لطفاً واحد شمارش را وارد کنید'); return; }
    if (!price || price <= 0) { showToast('لطفاً قیمت معتبر وارد کنید'); return; }
    
    if (editId) {
        const productIndex = products.findIndex(p => p.id == editId);
        if (productIndex !== -1) {
            products[productIndex].name = name;
            products[productIndex].unit = unit;
            products[productIndex].price = price;
            showToast('اطلاعات کالا با موفقیت ویرایش شد');
        }
    } else {
        const warehouseId = parseInt(document.getElementById('productWarehouse').value);
        const initialStock = parseFloat(toEnglishNumbers(document.getElementById('productInitialStock').value)) || 0;
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        
        products.push({ id: newId, name: name, unit: unit, price: price });
        
        if (initialStock > 0 && warehouseId) {
            inventory.push({ id: inventory.length + 1, productId: newId, warehouseId: warehouseId, quantity: initialStock });
            transactions.push({
                id: transactions.length + 1,
                type: 'purchase',
                productId: newId,
                fromWarehouse: null,
                toWarehouse: warehouseId,
                quantity: roundToTwoDecimals(initialStock),
                price: price,
                date: DEFAULT_PERSIAN_DATE,
                description: 'موجودی اولیه',
                timestamp: new Date().toISOString()
            });
        }
        showToast('کالا با موفقیت اضافه شد');
    }
    
    hideModal('productModal');
    renderProducts();
    populateProductSelects();
    filterInventory();
    renderPurchaseHistory();
    renderConsumptionHistory();
    autoSave();
}

function deleteProduct(id) {
    if (!hasPermission('can_edit_product')) {
        showToast('شما دسترسی حذف کالا را ندارید');
        return;
    }
    
    if (confirm('آیا از حذف این کالا اطمینان دارید؟')) {
        const index = products.findIndex(p => p.id === id);
        if (index > -1) {
            products.splice(index, 1);
            inventory = inventory.filter(item => item.productId !== id);
            renderProducts();
            populateProductSelects();
            filterInventory();
            showToast('کالا با موفقیت حذف شد');
            autoSave();
        }
    }
}

// ==================== مدیریت انبارها ====================

function showAddWarehouseModal() {
    if (!hasPermission('can_edit_product')) {
        showToast('شما دسترسی مدیریت انبار را ندارید');
        return;
    }
    
    document.getElementById('warehouseName').value = '';
    document.getElementById('warehouseDesc').value = '';
    document.getElementById('warehouseStatus').value = 'active';
    document.getElementById('warehouseModal').classList.add('active');
}

function editWarehouse(id) {
    if (!hasPermission('can_edit_product')) {
        showToast('شما دسترسی مدیریت انبار را ندارید');
        return;
    }
    
    const warehouse = warehouses.find(w => w.id === id);
    if (warehouse) {
        document.getElementById('warehouseName').value = warehouse.name;
        document.getElementById('warehouseDesc').value = warehouse.desc || '';
        document.getElementById('warehouseStatus').value = warehouse.status;
        document.getElementById('warehouseModal').dataset.editId = id;
        document.getElementById('warehouseModal').classList.add('active');
    }
}

function saveWarehouse() {
    const name = document.getElementById('warehouseName').value;
    const desc = document.getElementById('warehouseDesc').value;
    const status = document.getElementById('warehouseStatus').value;
    const editId = document.getElementById('warehouseModal').dataset.editId;
    
    if (!name) { showToast('لطفاً نام انبار را وارد کنید'); return; }
    
    if (editId) {
        const warehouse = warehouses.find(w => w.id == editId);
        if (warehouse) {
            warehouse.name = name;
            warehouse.desc = desc;
            warehouse.status = status;
        }
        delete document.getElementById('warehouseModal').dataset.editId;
    } else {
        warehouses.push({ id: warehouses.length + 1, name: name, desc: desc, status: status });
    }
    
    hideModal('warehouseModal');
    renderWarehouses();
    renderWarehouseCheckboxes();
    populateWarehouseSelects();
    showToast('انبار با موفقیت ذخیره شد');
    autoSave();
}

function deleteWarehouse(id) {
    if (!hasPermission('can_edit_product')) {
        showToast('شما دسترسی حذف انبار را ندارید');
        return;
    }
    
    if (id === MAIN_WAREHOUSE_ID) {
        showToast('انبار اصلی قابل حذف نیست');
        return;
    }
    
    if (confirm('آیا از حذف این انبار اطمینان دارید؟\nکالاهای موجود در این انبار به انبار اصلی منتقل خواهند شد.')) {
        inventory.forEach(item => {
            if (item.warehouseId === id && item.quantity > 0) {
                let mainItem = inventory.find(i => i.productId === item.productId && i.warehouseId === MAIN_WAREHOUSE_ID);
                if (mainItem) {
                    mainItem.quantity += item.quantity;
                } else {
                    inventory.push({ id: inventory.length + 1, productId: item.productId, warehouseId: MAIN_WAREHOUSE_ID, quantity: item.quantity });
                }
            }
        });
        
        const index = warehouses.findIndex(w => w.id === id);
        if (index > -1) warehouses.splice(index, 1);
        inventory = inventory.filter(item => item.warehouseId !== id);
        
        renderWarehouses();
        renderWarehouseCheckboxes();
        populateWarehouseSelects();
        filterInventory();
        showToast('انبار با موفقیت حذف و کالاها به انبار اصلی منتقل شدند');
        autoSave();
    }
}

// ==================== پشتیبان‌گیری ====================

function createBackup() {
    if (!hasPermission('can_backup')) {
        showToast('شما دسترسی پشتیبان‌گیری را ندارید');
        return;
    }
    
    const backupData = {
        version: '4.0',
        date: DEFAULT_PERSIAN_DATE,
        products: products,
        warehouses: warehouses,
        inventory: inventory,
        transactions: transactions,
        mainWarehouseId: MAIN_WAREHOUSE_ID
    };
    
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `backup_${new Date().getTime()}.json`);
    linkElement.click();
    
    localStorage.setItem('lastBackup', JSON.stringify({ date: DEFAULT_PERSIAN_DATE, size: Math.round(dataStr.length / 1024) + 'KB' }));
    updateBackupHistory();
    showToast('پشتیبان با موفقیت ایجاد شد');
}

function restoreFromBackup() {
    if (!hasPermission('can_restore')) {
        showToast('شما دسترسی بازیابی را ندارید');
        return;
    }
    
    const fileInput = document.getElementById('restoreFile');
    const file = fileInput.files[0];
    if (!file) { showToast('لطفاً یک فایل انتخاب کنید'); return; }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backupData = JSON.parse(e.target.result);
            if (backupData.products && backupData.warehouses) {
                products = backupData.products;
                warehouses = backupData.warehouses;
                inventory = backupData.inventory || [];
                transactions = backupData.transactions || [];
                
                renderWarehouseCheckboxes();
                renderInventory(getSelectedWarehouses());
                renderProducts();
                renderWarehouses();
                populateProductSelects();
                populateWarehouseSelects();
                renderPurchaseHistory();
                renderConsumptionHistory();
                
                showToast('بازیابی با موفقیت انجام شد');
                autoSave();
            } else {
                showToast('فرمت فایل پشتیبان نامعتبر است');
            }
        } catch (error) {
            showToast('خطا در خواندن فایل');
        }
    };
    reader.readAsText(file);
}

function updateBackupHistory() {
    const tbody = document.getElementById('backupHistory');
    if (!tbody) return;
    const lastBackup = JSON.parse(localStorage.getItem('lastBackup') || '{}');
    if (lastBackup.date) {
        document.getElementById('lastBackupDate').innerText = lastBackup.date;
        tbody.innerHTML = `<tr>
            <td>${lastBackup.date}</td>
            <td>—</td>
            <td>${lastBackup.size || '۲.۵ مگابایت'}</td>
            <td><button class="btn btn-gold" style="padding: 4px 8px;" onclick="restoreLastBackup()">بازیابی</button></td>
        </tr>`;
    }
}

function restoreLastBackup() {
    showToast('برای بازیابی آخرین پشتیبان، فایل مربوطه را انتخاب کنید');
}

function downloadExcelTemplate() {
    const template = `عنوان کالا	واحد	تعداد	قیمت واحد (ریال)	انبار
ظرف تک پرسی آلومینیومی	عدد	500	85000	انبار اصلی (صندوق)
ظرف کبابی دوخانه	عدد	300	160000	انبار اصلی (صندوق)
برنج طارم	کیلو	100	3500000	انبار خشکبار`;
    
    const blob = new Blob(['\uFEFF' + template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'نمونه_ورود_موجودی.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function detectDelimiter(line) {
    return line.includes('\t') ? '\t' : ',';
}

function importInitialStock() {
    if (!hasPermission('can_edit_product')) {
        showToast('شما دسترسی وارد کردن موجودی را ندارید');
        return;
    }
    
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];
    if (!file) { showToast('لطفاً یک فایل انتخاب کنید'); return; }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const lines = content.split('\n');
            if (lines[0].charCodeAt(0) === 0xFEFF) lines[0] = lines[0].slice(1);
            
            const delimiter = detectDelimiter(lines[0]);
            let successCount = 0, errorCount = 0, errors = [];
            
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const values = lines[i].split(delimiter).map(v => v.trim());
                if (values.length < 5) {
                    errorCount++;
                    errors.push(`خط ${i+1}: تعداد ستون‌ها ${values.length} است (حداقل ۵ ستون نیاز است)`);
                    continue;
                }
                
                const productName = values[0];
                const unit = values[1];
                const quantity = parseFloat(toEnglishNumbers(values[2].replace(/,/g, '')));
                const price = parseFloat(toEnglishNumbers(values[3].replace(/,/g, '')));
                const warehouseName = values[4];
                
                if (!productName) { errorCount++; errors.push(`خط ${i+1}: عنوان کالا خالی است`); continue; }
                if (!unit) { errorCount++; errors.push(`خط ${i+1}: واحد شمارش خالی است`); continue; }
                if (isNaN(price) || price <= 0) { errorCount++; errors.push(`خط ${i+1}: قیمت نامعتبر است`); continue; }
                if (isNaN(quantity) || quantity < 0) { errorCount++; errors.push(`خط ${i+1}: تعداد نامعتبر است`); continue; }
                
                let warehouse = warehouses.find(w => w.name === warehouseName);
                if (!warehouse) {
                    errorCount++;
                    errors.push(`خط ${i+1}: انبار "${warehouseName}" یافت نشد`);
                    continue;
                }
                
                const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
                products.push({ id: newId, name: productName, unit: unit, price: roundToTwoDecimals(price) });
                
                if (quantity > 0) {
                    inventory.push({ id: inventory.length + 1, productId: newId, warehouseId: warehouse.id, quantity: roundToTwoDecimals(quantity) });
                    transactions.push({
                        id: transactions.length + 1,
                        type: 'purchase',
                        productId: newId,
                        fromWarehouse: null,
                        toWarehouse: warehouse.id,
                        quantity: roundToTwoDecimals(quantity),
                        price: roundToTwoDecimals(price),
                        date: DEFAULT_PERSIAN_DATE,
                        description: 'موجودی اولیه (ورود از اکسل)',
                        timestamp: new Date().toISOString()
                    });
                }
                successCount++;
            }
            
            const resultDiv = document.getElementById('excelImportResult');
            resultDiv.style.display = 'block';
            let resultHtml = `<div style="padding: 15px; border-radius: 8px; background-color: ${errorCount === 0 ? '#d4edda' : '#fff3cd'}; color: ${errorCount === 0 ? '#155724' : '#856404'};">`;
            resultHtml += `<strong>✅ نتیجه وارد کردن:</strong><br>تعداد موفق: ${successCount}<br>تعداد ناموفق: ${errorCount}<br>`;
            if (errors.length > 0) {
                resultHtml += `<div style="margin-top: 10px; max-height: 200px; overflow-y: auto;"><strong>خطاها:</strong><br>${errors.map(err => `⚠️ ${err}`).join('<br>')}</div>`;
            }
            resultHtml += `</div>`;
            resultDiv.innerHTML = resultHtml;
            
            renderProducts();
            populateProductSelects();
            filterInventory();
            showToast(`✅ ${successCount} کالا با موفقیت اضافه شد`);
            autoSave();
        } catch (error) {
            showToast('خطا در خواندن فایل: ' + error.message);
        }
    };
    reader.readAsText(file, 'UTF-8');
}

function clearAllData() {
    if (!hasPermission('can_delete_all')) {
        showToast('شما دسترسی حذف همه داده‌ها را ندارید');
        return;
    }
    
    if (!document.getElementById('confirmDelete1').checked) {
        showToast('لطفاً ابتدا تیک "من می‌دانم که این عملیات غیرقابل بازگشت است" را بزنید');
        return;
    }
    if (!document.getElementById('confirmDelete2').checked) {
        showToast('لطفاً ابتدا تیک "من از پاک شدن تمام اطلاعات مطمئن هستم" را بزنید');
        return;
    }
    if (!document.getElementById('confirmDelete3').checked) {
        showToast('لطفاً ابتدا تیک "من یک نسخه پشتیبان از اطلاعات گرفته‌ام" را بزنید');
        return;
    }
    
    if (!confirm('⚠️ هشدار نهایی: آیا کاملاً مطمئن هستید؟ این عملیات غیرقابل بازگشت است!')) return;
    
    products = [];
    warehouses = [{ id: 1, name: "انبار اصلی (صندوق)", status: "active", desc: "انبار اصلی و صندوق اولیه کلیه کالاها" }];
    inventory = [];
    transactions = [];
    
    renderWarehouseCheckboxes();
    renderInventory(getSelectedWarehouses());
    renderProducts();
    renderWarehouses();
    populateProductSelects();
    populateWarehouseSelects();
    renderPurchaseHistory();
    renderConsumptionHistory();
    
    showToast('✅ تمام اطلاعات با موفقیت پاک شد');
    autoSave();
}

// ==================== توابع متفرقه ====================

function refreshInventory() {
    filterInventory();
    showToast('اطلاعات بروزرسانی شد');
}

function printReport() {
    window.print();
}

function exportToExcel(reportType = 'گزارش') {
    exportInventoryToExcel();
}

function autoSave() {
    const backupData = {
        products: products,
        warehouses: warehouses,
        inventory: inventory,
        transactions: transactions,
        lastSaved: new Date().toISOString()
    };
    localStorage.setItem('restaurantInventory', JSON.stringify(backupData));
}

function loadFromStorage() {
    const saved = localStorage.getItem('restaurantInventory');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.products) products = data.products;
            if (data.warehouses) warehouses = data.warehouses;
            if (data.inventory) inventory = data.inventory;
            if (data.transactions) transactions = data.transactions;
        } catch(e) { console.log('خطا در بارگذاری'); }
    }
    
    if (products.length === 0) {
        // داده‌های پیش‌فرض
        products = [
            {id: 1, name: "ظرف تک پرسی آلومینیومی", unit: "عدد", price: 85000},
            {id: 2, name: "ظرف کبابی دوخانه", unit: "عدد", price: 160000},
            {id: 3, name: "شکر", unit: "بسته", price: 1000000},
            {id: 4, name: "روغن لادن ۱۶ کیلویی", unit: "عدد", price: 12500000},
            {id: 5, name: "لیوان کاغذی", unit: "عدد", price: 18000}
        ];
        warehouses = [
            {id: 1, name: "انبار اصلی (صندوق)", status: "active", desc: "انبار اصلی"},
            {id: 2, name: "انبار یخچالی", status: "active", desc: "انبار مواد فاسدشدنی"},
            {id: 3, name: "انبار خشکبار", status: "active", desc: "انبار حبوبات و خشکبار"}
        ];
        inventory = [];
        transactions = [];
    }
}

function initTabs() {
    document.querySelectorAll('.ribbon-item').forEach(item => {
        item.addEventListener('click', function() {
            if (this.dataset.page === 'users' && !hasPermission('can_manage_users')) {
                showToast('شما دسترسی مدیریت کاربران را ندارید');
                return;
            }
            
            document.querySelectorAll('.ribbon-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            const pageId = this.dataset.page;
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');
            
            if (pageId === 'users') renderUsersList();
            if (pageId === 'purchase') { paginationState.purchase.page = 1; renderPurchaseHistory(); }
            if (pageId === 'consumption') { paginationState.consumption.page = 1; renderConsumptionHistory(); }
            if (pageId === 'products') renderProducts();
            if (pageId === 'dashboard') filterInventory();
            if (pageId === 'warehouses') renderWarehouses();
            if (pageId === 'reports') generateMovementReport();
            if (pageId === 'transfer') {
                document.getElementById('bulkTransferCheck').checked = false;
                document.getElementById('singleTransfer').style.display = 'block';
                document.getElementById('bulkTransfer').style.display = 'none';
            }
        });
    });
}

function initApp() {
    updateAllDates();
    loadFromStorage();
    renderWarehouseCheckboxes();
    renderInventory(getSelectedWarehouses());
    renderProducts();
    renderWarehouses();
    populateProductSelects();
    populateWarehouseSelects();
    renderPurchaseHistory();
    renderConsumptionHistory();
    updateBackupHistory();
    initTabs();
    
    setInterval(updateAllDates, 1000);
    setInterval(autoSave, 300000);
    window.addEventListener('beforeunload', autoSave);
}

// بررسی احراز هویت در شروع
if (checkAuth()) {
    initApp();
}
