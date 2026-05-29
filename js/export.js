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