import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    deleteDoc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC7WLPOcBt2DMDNPS_jgchbxEClsRROCN4",
    authDomain: "menudamgi.firebaseapp.com",
    projectId: "menudamgi",
    storageBucket: "menudamgi.firebasestorage.app",
    messagingSenderId: "447498912854",
    appId: "1:447498912854:web:d779ac854414dc5a3e67f7",
    measurementId: "G-NBFLS9PC5J"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const TEMPLATE_KEY = 'menudamgi_templates';

export function generateSessionCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i += 1) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export async function getAllSessions() {
    try {
        const sessionsCol = collection(db, 'sessions');
        const q = query(sessionsCol, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const sessions = [];
        snapshot.forEach(item => {
            sessions.push({ id: item.id, ...item.data() });
        });
        return sessions;
    } catch (error) {
        console.error('Error getting sessions:', error);
        return [];
    }
}

export async function getSession(sessionId) {
    try {
        const docRef = doc(db, 'sessions', sessionId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
        console.error('Error getting session:', error);
        return null;
    }
}

export async function saveSession(session) {
    try {
        const docRef = doc(db, 'sessions', session.id);
        await setDoc(docRef, session);
        return true;
    } catch (error) {
        console.error('Error saving session:', error);
        return false;
    }
}

export async function addOrderToSession(sessionId, order) {
    try {
        const session = await getSession(sessionId);
        if (!session) {
            console.error('Session not found:', sessionId);
            return false;
        }

        session.orders = session.orders || [];
        session.orders.push(order);
        return saveSession(session);
    } catch (error) {
        console.error('Error adding order:', error);
        return false;
    }
}

export async function findOrderByUserName(sessionId, userName) {
    try {
        const session = await getSession(sessionId);
        if (!session) {
            return null;
        }

        return (session.orders || []).find(order => order.userName === userName) || null;
    } catch (error) {
        console.error('Error finding order:', error);
        return null;
    }
}

export async function updateOrderInSession(sessionId, userName, updatedOrder) {
    try {
        const session = await getSession(sessionId);
        if (!session) {
            console.error('Session not found:', sessionId);
            return false;
        }

        session.orders = session.orders || [];
        const orderIndex = session.orders.findIndex(order => order.userName === userName);

        if (orderIndex >= 0) {
            session.orders[orderIndex] = updatedOrder;
        } else {
            session.orders.push(updatedOrder);
        }

        return saveSession(session);
    } catch (error) {
        console.error('Error updating order:', error);
        return false;
    }
}

export async function deleteSession(sessionId) {
    try {
        const docRef = doc(db, 'sessions', sessionId);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error('Error deleting session:', error);
        return false;
    }
}

export async function updateSession(sessionId, updates) {
    try {
        const session = await getSession(sessionId);
        if (!session) {
            return false;
        }

        Object.assign(session, updates);
        return saveSession(session);
    } catch (error) {
        console.error('Error updating session:', error);
        return false;
    }
}

export function formatDate(dateString) {
    return new Date(dateString).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function formatPrice(price) {
    return `${parseInt(price, 10).toLocaleString()}원`;
}

export function isSessionExpired(session) {
    return new Date(session.deadline) < new Date();
}

export function getTimeRemaining(deadline) {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end - now;

    if (diff <= 0) {
        return '마감';
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours}시간 ${minutes}분 남음`;
    }

    return `${minutes}분 남음`;
}

export function getAllTemplates() {
    const data = localStorage.getItem(TEMPLATE_KEY);
    return data ? JSON.parse(data) : [];
}

export function saveTemplate(template) {
    const templates = getAllTemplates();
    const index = templates.findIndex(item => item.id === template.id);

    if (index >= 0) {
        templates[index] = template;
    } else {
        templates.push(template);
    }

    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
}

export function deleteTemplate(templateId) {
    const templates = getAllTemplates();
    const filtered = templates.filter(item => item.id !== templateId);
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(filtered));
}
