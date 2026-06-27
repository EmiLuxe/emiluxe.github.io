import { db } from './firebase-config.js';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    orderBy,
    Timestamp,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const app = document.getElementById('app');

const PRODUCTS = {
    cocktails: [
        { id: 'sangre-marte', name: 'Sangre de Marte', type: 'cocktail', base: 0 },
        { id: 'nubo-estelar', name: 'Nubo Estelar', type: 'cocktail', base: 0 },
        { id: 'mora-cosmic', name: 'Mora Cosmic', type: 'cocktail', base: 0 },
        { id: 'plasma-green', name: 'Plasma Green', type: 'cocktail', base: 0 }
    ],
    sizes: [
        { id: 'small', name: 'Pequeño', price: 13000 },
        { id: 'large', name: 'Grande', price: 16000 }
    ],
    additions: [
        { id: 'gomas', name: 'Gomas', price: 2000 },
        { id: 'shot', name: 'Shot', price: 3000 }
    ],
    other: [
        { id: 'michelada', name: 'Michelada', price: 7000 },
        { id: 'cerveza', name: 'Cerveza', price: 5000 },
        { id: 'soda', name: 'Soda saborizada', price: 11000 },
        { id: 'maracumango', name: 'Maracumango', price: 12000 },
        { id: 'cuates', name: 'Cuates enchilados', price: 16000 }
    ]
};

let currentShift = null;
let currentAccount = null;
let allAccounts = [];
let allShifts = [];

const formatCOP = (value) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(value);
};

const getCurrentDate = () => {
    const date = new Date();
    return date.toISOString().split('T')[0];
};

const formatTime = (date) => {
    if (!date) return '--:--';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};

const loadShifts = async () => {
    const shiftsRef = collection(db, 'shifts');
    const q = query(shiftsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    allShifts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const loadCurrentShift = async () => {
    const shiftsRef = collection(db, 'shifts');
    const todayDate = getCurrentDate();
    const q = query(
        shiftsRef,
        where('date', '==', todayDate),
        where('status', '==', 'open')
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.docs.length > 0) {
        currentShift = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        await loadAccounts();
        showMainScreen();
    } else {
        showStartShiftScreen();
    }
};

const loadAccounts = async () => {
    if (!currentShift) return;
    const accountsRef = collection(db, 'shifts', currentShift.id, 'accounts');
    const snapshot = await getDocs(accountsRef);
    allAccounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const startShift = async () => {
    const now = new Date();
    const shiftData = {
        date: getCurrentDate(),
        startTime: Timestamp.fromDate(now),
        status: 'open',
        createdAt: Timestamp.fromDate(now),
        totalSales: 0,
        totalCash: 0,
        totalTransfer: 0
    };
    
    const shiftsRef = collection(db, 'shifts');
    const shiftDoc = await addDoc(shiftsRef, shiftData);
    currentShift = { id: shiftDoc.id, ...shiftData };
    allAccounts = [];
    showMainScreen();
};

const createAccount = async (name) => {
    if (!currentShift) return;
    
    const now = new Date();
    const accountData = {
        name: name,
        createdAt: Timestamp.fromDate(now),
        status: 'pending',
        paymentMethod: null,
        items: [],
        total: 0
    };
    
    const accountsRef = collection(db, 'shifts', currentShift.id, 'accounts');
    const accountDoc = await addDoc(accountsRef, accountData);
    currentAccount = { id: accountDoc.id, ...accountData };
    await loadAccounts();
    showAccountDetailScreen();
};

const updateAccountTotal = () => {
    if (!currentAccount) return;
    currentAccount.total = currentAccount.items.reduce((sum, item) => sum + item.total, 0);
};

const addItemToAccount = (product, size = null, additions = []) => {
    if (!currentAccount) return;
    
    let itemName = product.name;
    let itemPrice = product.price || 0;
    let itemDetails = '';
    
    if (product.type === 'cocktail') {
        itemPrice = size.price;
        itemName = `${product.name} (${size.name})`;
        itemDetails = size.name;
        
        if (additions.length > 0) {
            const additionsText = additions.map(a => a.name).join(', ');
            itemDetails += ` + ${additionsText}`;
            itemPrice += additions.reduce((sum, a) => sum + a.price, 0);
        }
    }
    
    const item = {
        id: Math.random().toString(36).substr(2, 9),
        name: itemName,
        productId: product.id,
        price: itemPrice,
        quantity: 1,
        details: itemDetails,
        total: itemPrice,
        type: product.type
    };
    
    currentAccount.items.push(item);
    updateAccountTotal();
};

const updateItemQuantity = (itemId, newQty) => {
    if (!currentAccount) return;
    const item = currentAccount.items.find(i => i.id === itemId);
    if (item) {
        item.quantity = Math.max(1, newQty);
        item.total = item.price * item.quantity;
        updateAccountTotal();
    }
};

const removeItem = (itemId) => {
    if (!currentAccount) return;
    currentAccount.items = currentAccount.items.filter(i => i.id !== itemId);
    updateAccountTotal();
};

const saveAccount = async () => {
    if (!currentShift || !currentAccount) return;
    
    const accountsRef = doc(db, 'shifts', currentShift.id, 'accounts', currentAccount.id);
    await updateDoc(accountsRef, {
        name: currentAccount.name,
        items: currentAccount.items,
        total: currentAccount.total,
        status: currentAccount.status,
        paymentMethod: currentAccount.paymentMethod
    });
    
    await loadAccounts();
};

const closeAccount = async (accountId, status, paymentMethod = null) => {
    if (!currentShift) return;
    
    const accountsRef = doc(db, 'shifts', currentShift.id, 'accounts', accountId);
    const account = allAccounts.find(a => a.id === accountId);
    
    if (status === 'pending') {
        await updateDoc(accountsRef, {
            status: 'pending',
            paymentMethod: null
        });
    } else {
        await updateDoc(accountsRef, {
            status: 'paid',
            paymentMethod: paymentMethod
        });
    }
    
    await loadAccounts();
    currentAccount = null;
    showMainScreen();
};

const finishShift = async () => {
    if (!currentShift) return;
    
    const pendingAccounts = allAccounts.filter(a => a.status === 'pending');
    if (pendingAccounts.length > 0) {
        alert('No puedes finalizar el turno con cuentas pendientes');
        return;
    }
    
    const now = new Date();
    const totalCash = allAccounts
        .filter(a => a.paymentMethod === 'cash')
        .reduce((sum, a) => sum + a.total, 0);
    
    const totalTransfer = allAccounts
        .filter(a => a.paymentMethod === 'transfer')
        .reduce((sum, a) => sum + a.total, 0);
    
    const shiftRef = doc(db, 'shifts', currentShift.id);
    await updateDoc(shiftRef, {
        status: 'closed',
        endTime: Timestamp.fromDate(now),
        totalSales: allAccounts.reduce((sum, a) => sum + a.total, 0),
        totalCash: totalCash,
        totalTransfer: totalTransfer,
        accountsCount: allAccounts.length,
        accounts: allAccounts
    });
    
    currentShift = null;
    currentAccount = null;
    allAccounts = [];
    await loadCurrentShift();
};

const calculateStats = (shifts, period) => {
    const now = new Date();
    let filtered = [];
    
    if (period === 'daily') {
        const today = getCurrentDate();
        filtered = shifts.filter(s => s.date === today && s.status === 'closed');
    } else if (period === 'weekly') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = shifts.filter(s => {
            const shiftDate = new Date(s.date);
            return shiftDate >= weekAgo && s.status === 'closed';
        });
    } else if (period === 'monthly') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = shifts.filter(s => {
            const shiftDate = new Date(s.date);
            return shiftDate >= monthAgo && s.status === 'closed';
        });
    } else if (period === 'yearly') {
        const yearAgo = new Date(now);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        filtered = shifts.filter(s => {
            const shiftDate = new Date(s.date);
            return shiftDate >= yearAgo && s.status === 'closed';
        });
    }
    
    const stats = {
        totalSales: 0,
        accountsCount: 0,
        averageTicket: 0,
        totalCash: 0,
        totalTransfer: 0,
        products: {}
    };
    
    filtered.forEach(shift => {
        stats.totalSales += shift.totalSales || 0;
        stats.totalCash += shift.totalCash || 0;
        stats.totalTransfer += shift.totalTransfer || 0;
        stats.accountsCount += shift.accountsCount || 0;
        
        if (shift.accounts) {
            shift.accounts.forEach(account => {
                account.items.forEach(item => {
                    if (!stats.products[item.productId]) {
                        stats.products[item.productId] = {
                            name: item.name.split('(')[0].trim(),
                            quantity: 0,
                            total: 0
                        };
                    }
                    stats.products[item.productId].quantity += item.quantity;
                    stats.products[item.productId].total += item.total;
                });
            });
        }
    });
    
    stats.averageTicket = stats.accountsCount > 0 ? Math.round(stats.totalSales / stats.accountsCount) : 0;
    
    return stats;
};

// === SCREEN RENDERERS ===

const showStartShiftScreen = () => {
    app.innerHTML = `
        <div class="start-shift-screen">
            <h1>BAR POS</h1>
            <button class="btn-start-shift" onclick="window.startNewShift()">INICIAR TURNO</button>
        </div>
    `;
};

const showMainScreen = () => {
    const searchInput = document.querySelector('.search-container input');
    let searchTerm = searchInput ? searchInput.value : '';
    
    let filtered = allAccounts;
    if (searchTerm) {
        filtered = allAccounts.filter(a => 
            a.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    const totalSales = allAccounts.reduce((sum, a) => sum + a.total, 0);
    
    let accountsHTML = filtered.map(account => `
        <div class="account-card ${account.status}" onclick="window.openAccount('${account.id}')">
            <div class="account-header">
                <div class="account-name">${account.name}</div>
                <div class="account-status ${account.status}">
                    ${account.status === 'pending' ? 'Pendiente' : 'Pagada'}
                </div>
            </div>
            <div class="account-meta">
                <span>${formatTime(account.createdAt)}</span>
                <span>${account.paymentMethod === 'cash' ? 'Efectivo' : account.paymentMethod === 'transfer' ? 'Transferencia' : 'Sin pagar'}</span>
            </div>
            <div class="account-total">${formatCOP(account.total)}</div>
        </div>
    `).join('');
    
    app.innerHTML = `
        <div class="main-screen">
            <div class="header">
                <div class="header-left">
                    <div class="header-title">
                        <h1>Bar POS</h1>
                    </div>
                </div>
                <div class="search-container">
                    <input type="text" placeholder="Buscar cuenta..." class="search-input" value="${searchTerm}">
                </div>
                <div class="header-info">
                    <div>${formatTime(currentShift.startTime)}</div>
                </div>
            </div>
            
            <div class="content" id="accounts-container">
                ${accountsHTML}
            </div>
            
            <div class="total-bar">
                Total del turno: <span>${formatCOP(totalSales)}</span>
            </div>
            
            <div class="footer">
                <button class="btn btn-primary" onclick="window.createNewAccount()">+ NUEVA CUENTA</button>
                <button class="btn btn-secondary" onclick="window.showPerformance()">DESEMPEÑO</button>
                <button class="btn btn-danger" onclick="window.finishShift()">FINALIZAR</button>
            </div>
        </div>
    `;
    
    document.querySelector('.search-input').addEventListener('input', (e) => {
        showMainScreen();
    });
};

const showAccountDetailScreen = () => {
    if (!currentAccount) return;
    
    const itemsHTML = currentAccount.items.map(item => `
        <div class="item">
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                ${item.details ? `<div class="item-details">${item.details}</div>` : ''}
            </div>
            <div class="item-price">${formatCOP(item.price)}</div>
            <div class="item-qty">
                <button class="qty-btn" onclick="window.updateQty('${item.id}', -1)">-</button>
                <input type="number" class="qty-input" value="${item.quantity}" readonly>
                <button class="qty-btn" onclick="window.updateQty('${item.id}', 1)">+</button>
                <button class="remove-btn" onclick="window.removeItemFromAccount('${item.id}')">Eliminar</button>
            </div>
        </div>
    `).join('');
    
    app.innerHTML = `
        <div class="main-screen">
            <div class="modal active" id="account-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Cuenta: ${currentAccount.name}</h2>
                        <button class="close-btn" onclick="window.closeAccountModal()">×</button>
                    </div>
                    
                    <form onsubmit="event.preventDefault();" class="form-group">
                        <label>Nombre de la cuenta</label>
                        <input type="text" id="account-name" value="${currentAccount.name}" onchange="window.updateAccountName(this.value)">
                    </form>
                    
                    <div class="items-list">
                        ${itemsHTML}
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <h3 style="color: #00d4ff; margin-bottom: 1rem;">Agregar productos</h3>
                        
                        <h4 style="color: #888; margin: 1.5rem 0 0.8rem 0;">Cócteles</h4>
                        <div class="products-grid">
                            ${PRODUCTS.cocktails.map(cocktail => `
                                <button type="button" class="product-btn" onclick="window.showCocktailOptions('${cocktail.id}')">
                                    ${cocktail.name}
                                </button>
                            `).join('')}
                        </div>
                        
                        <h4 style="color: #888; margin: 1.5rem 0 0.8rem 0;">Otros</h4>
                        <div class="products-grid">
                            ${PRODUCTS.other.map(product => `
                                <button type="button" class="product-btn" onclick="window.addProduct('${product.id}')">
                                    ${product.name}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div style="background: #1a1a1a; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: center;">
                        <div style="font-size: 0.9rem; color: #888; margin-bottom: 0.5rem;">TOTAL</div>
                        <div style="font-size: 2rem; font-weight: 700; color: #00d4ff;">${formatCOP(currentAccount.total)}</div>
                    </div>
                    
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-secondary" onclick="window.closeAccountModal()" style="flex: 1;">VOLVER</button>
                        <button class="btn btn-primary" onclick="window.closeAccountFinish()" style="flex: 1;">CERRAR CUENTA</button>
                    </div>
                </div>
            </div>
        </div>
    `;
};

const showCocktailOptionsScreen = (cocktailId) => {
    const cocktail = PRODUCTS.cocktails.find(c => c.id === cocktailId);
    if (!cocktail) return;
    
    app.innerHTML = `
        <div class="main-screen">
            <div class="modal active" id="cocktail-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${cocktail.name}</h2>
                        <button class="close-btn" onclick="window.closeCocktailOptions()">×</button>
                    </div>
                    
                    <div class="cocktail-options">
                        <div class="option-group">
                            <div class="option-title">Tamaño</div>
                            <div class="option-buttons">
                                ${PRODUCTS.sizes.map(size => `
                                    <button type="button" class="option-btn" data-size="${size.id}" onclick="window.selectSize(this, '${size.id}')">
                                        ${size.name} ${formatCOP(size.price)}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="option-group">
                            <div class="option-title">Adiciones (opcional)</div>
                            <div class="option-buttons">
                                ${PRODUCTS.additions.map(addition => `
                                    <button type="button" class="option-btn" data-addition="${addition.id}" onclick="window.toggleAddition(this, '${addition.id}')">
                                        ${addition.name} ${formatCOP(addition.price)}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: #1a1a1a; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: center;">
                        <div style="font-size: 0.9rem; color: #888; margin-bottom: 0.5rem;">PRECIO TOTAL</div>
                        <div style="font-size: 2rem; font-weight: 700; color: #00d4ff;" id="cocktail-price">${formatCOP(0)}</div>
                    </div>
                    
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-secondary" onclick="window.closeCocktailOptions()" style="flex: 1;">CANCELAR</button>
                        <button class="btn btn-primary" onclick="window.addCocktailToAccount('${cocktailId}')" style="flex: 1;">AGREGAR</button>
                    </div>
                </div>
            </div>
        </div>
    `;
};

const showPaymentScreen = (accountId) => {
    app.innerHTML = `
        <div class="main-screen">
            <div class="modal active" id="payment-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>¿Ya pagó?</h2>
                    </div>
                    
                    <div class="confirmation">
                        <div style="display: flex; flex-direction: column; gap: 1rem;">
                            <button class="btn btn-secondary" onclick="window.completePayment('${accountId}', 'pending')" style="width: 100%;">
                                PENDIENTE
                            </button>
                            <button class="btn btn-primary" onclick="window.completePayment('${accountId}', 'cash')" style="width: 100%;">
                                EFECTIVO
                            </button>
                            <button class="btn btn-primary" onclick="window.completePayment('${accountId}', 'transfer')" style="width: 100%;">
                                TRANSFERENCIA
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

const showPerformanceScreen = (period = 'daily') => {
    const stats = calculateStats(allShifts, period);
    
    const sortedProducts = Object.entries(stats.products)
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .slice(0, 5);
    
    const productsHTML = sortedProducts.map(([id, data]) => `
        <div style="padding: 0.8rem; border-bottom: 1px solid #444; display: flex; justify-content: space-between;">
            <span>${data.name}</span>
            <strong style="color: #00d4ff;">${data.quantity} un. - ${formatCOP(data.total)}</strong>
        </div>
    `).join('');
    
    app.innerHTML = `
        <div class="performance-screen">
            <div class="performance-header">
                <h1>DESEMPEÑO</h1>
                <div class="period-selector">
                    <button class="period-btn ${period === 'daily' ? 'active' : ''}" onclick="window.showPerformanceWithPeriod('daily')">Diario</button>
                    <button class="period-btn ${period === 'weekly' ? 'active' : ''}" onclick="window.showPerformanceWithPeriod('weekly')">Semanal</button>
                    <button class="period-btn ${period === 'monthly' ? 'active' : ''}" onclick="window.showPerformanceWithPeriod('monthly')">Mensual</button>
                    <button class="period-btn ${period === 'yearly' ? 'active' : ''}" onclick="window.showPerformanceWithPeriod('yearly')">Anual</button>
                </div>
            </div>
            
            <div class="performance-content">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Ventas Totales</div>
                        <div class="stat-value">${formatCOP(stats.totalSales)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Número de Cuentas</div>
                        <div class="stat-value">${stats.accountsCount}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Ticket Promedio</div>
                        <div class="stat-value">${formatCOP(stats.averageTicket)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Total Efectivo</div>
                        <div class="stat-value">${formatCOP(stats.totalCash)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Total Transferencia</div>
                        <div class="stat-value">${formatCOP(stats.totalTransfer)}</div>
                    </div>
                </div>
                
                <div class="chart-container">
                    <h3>Productos más vendidos</h3>
                    <div style="background: #1a1a1a; border-radius: 8px; margin-bottom: 1rem;">
                        ${productsHTML}
                    </div>
                </div>
                
                <div class="footer" style="position: sticky; bottom: 0;">
                    <button class="btn btn-secondary" onclick="window.showMainScreen()" style="width: 100%;">VOLVER</button>
                </div>
            </div>
        </div>
    `;
};

// === GLOBAL FUNCTIONS ===

window.startNewShift = async () => {
    await startShift();
};

window.createNewAccount = async () => {
    const name = prompt('Nombre de la cuenta:');
    if (name && name.trim()) {
        await createAccount(name.trim());
    }
};

window.openAccount = (accountId) => {
    currentAccount = allAccounts.find(a => a.id === accountId);
    if (currentAccount) {
        currentAccount.items = currentAccount.items || [];
        showAccountDetailScreen();
    }
};

window.closeAccountModal = () => {
    currentAccount = null;
    showMainScreen();
};

window.updateAccountName = (newName) => {
    if (currentAccount) {
        currentAccount.name = newName;
    }
};

window.updateQty = (itemId, delta) => {
    updateItemQuantity(itemId, (currentAccount.items.find(i => i.id === itemId)?.quantity || 1) + delta);
    showAccountDetailScreen();
};

window.removeItemFromAccount = (itemId) => {
    removeItem(itemId);
    showAccountDetailScreen();
};

window.closeAccountFinish = async () => {
    if (!currentAccount || !currentAccount.items.length) {
        alert('Debes agregar productos a la cuenta');
        return;
    }
    
    await saveAccount();
    showPaymentScreen(currentAccount.id);
};

window.showCocktailOptions = (cocktailId) => {
    showCocktailOptionsScreen(cocktailId);
};

window.closeCocktailOptions = () => {
    showAccountDetailScreen();
};

window.selectSize = (btn, sizeId) => {
    document.querySelectorAll('[data-size]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateCocktailPrice();
};

window.toggleAddition = (btn, additionId) => {
    btn.classList.toggle('active');
    updateCocktailPrice();
};

window.updateCocktailPrice = () => {
    const selectedSize = document.querySelector('[data-size].active');
    const selectedAdditions = Array.from(document.querySelectorAll('[data-addition].active'));
    
    let price = selectedSize ? PRODUCTS.sizes.find(s => s.id === selectedSize.dataset.size).price : 0;
    selectedAdditions.forEach(btn => {
        price += PRODUCTS.additions.find(a => a.id === btn.dataset.addition).price;
    });
    
    document.getElementById('cocktail-price').textContent = formatCOP(price);
};

window.addCocktailToAccount = (cocktailId) => {
    const cocktail = PRODUCTS.cocktails.find(c => c.id === cocktailId);
    const sizeBtn = document.querySelector('[data-size].active');
    const size = sizeBtn ? PRODUCTS.sizes.find(s => s.id === sizeBtn.dataset.size) : null;
    const additions = Array.from(document.querySelectorAll('[data-addition].active')).map(btn => 
        PRODUCTS.additions.find(a => a.id === btn.dataset.addition)
    );
    
    if (!size) {
        alert('Selecciona un tamaño');
        return;
    }
    
    addItemToAccount(cocktail, size, additions);
    showAccountDetailScreen();
};

window.addProduct = (productId) => {
    const product = PRODUCTS.other.find(p => p.id === productId);
    if (product) {
        addItemToAccount(product);
        showAccountDetailScreen();
    }
};

window.completePayment = async (accountId, paymentType) => {
    const account = allAccounts.find(a => a.id === accountId);
    if (!account) return;
    
    const paymentMethodMap = {
        'pending': null,
        'cash': 'cash',
        'transfer': 'transfer'
    };
    
    await closeAccount(accountId, paymentType, paymentMethodMap[paymentType]);
};

window.finishShift = async () => {
    if (!currentShift) return;
    
    const pendingAccounts = allAccounts.filter(a => a.status === 'pending');
    if (pendingAccounts.length > 0) {
        alert(`No puedes finalizar el turno. Hay ${pendingAccounts.length} cuenta(s) pendiente(s)`);
        return;
    }
    
    if (confirm('¿Finalizar turno?')) {
        await finishShift();
    }
};

window.showMainScreen = async () => {
    currentAccount = null;
    await loadAccounts();
    showMainScreen();
};

window.showPerformance = async () => {
    await loadShifts();
    showPerformanceScreen('daily');
};

window.showPerformanceWithPeriod = (period) => {
    showPerformanceScreen(period);
};

// === INIT ===
(async () => {
    await loadCurrentShift();
})();
