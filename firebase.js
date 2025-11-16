// Firebase 초기화 및 설정
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    deleteDoc, 
    updateDoc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyC7WLPOcBt2DMDNPS_jgchbxEClsRROCN4",
    authDomain: "menudamgi.firebaseapp.com",
    projectId: "menudamgi",
    storageBucket: "menudamgi.firebasestorage.app",
    messagingSenderId: "447498912854",
    appId: "1:447498912854:web:d779ac854414dc5a3e67f7",
    measurementId: "G-NBFLS9PC5J"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 세션 코드 생성 (6자리 영문+숫자)
export function generateSessionCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// 모든 세션 가져오기
export async function getAllSessions() {
    try {
        const sessionsCol = collection(db, 'sessions');
        const q = query(sessionsCol, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const sessions = [];
        snapshot.forEach(doc => {
            sessions.push({ id: doc.id, ...doc.data() });
        });
        return sessions;
    } catch (error) {
        console.error('Error getting sessions:', error);
        return [];
    }
}

// 특정 세션 가져오기
export async function getSession(sessionId) {
    try {
        const docRef = doc(db, 'sessions', sessionId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error getting session:', error);
        return null;
    }
}

// 세션 저장
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

// 세션에 주문 추가
export async function addOrderToSession(sessionId, order) {
    try {
        const session = await getSession(sessionId);
        if (!session) {
            console.error('Session not found:', sessionId);
            return false;
        }
        
        session.orders.push(order);
        await saveSession(session);
        return true;
    } catch (error) {
        console.error('Error adding order:', error);
        return false;
    }
}

// 세션에서 특정 사용자의 기존 주문 찾기
export async function findOrderByUserName(sessionId, userName) {
    try {
        const session = await getSession(sessionId);
        if (!session) {
            return null;
        }
        
        return session.orders.find(order => order.userName === userName);
    } catch (error) {
        console.error('Error finding order:', error);
        return null;
    }
}

// 세션의 주문 업데이트 (같은 이름의 기존 주문 수정)
export async function updateOrderInSession(sessionId, userName, updatedOrder) {
    try {
        const session = await getSession(sessionId);
        if (!session) {
            console.error('Session not found:', sessionId);
            return false;
        }
        
        const orderIndex = session.orders.findIndex(order => order.userName === userName);
        if (orderIndex >= 0) {
            // 기존 주문 업데이트
            session.orders[orderIndex] = updatedOrder;
        } else {
            // 새 주문 추가
            session.orders.push(updatedOrder);
        }
        
        await saveSession(session);
        return true;
    } catch (error) {
        console.error('Error updating order:', error);
        return false;
    }
}

// 세션 삭제
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

// 세션 업데이트
export async function updateSession(sessionId, updates) {
    try {
        const session = await getSession(sessionId);
        if (!session) {
            return false;
        }
        
        Object.assign(session, updates);
        await saveSession(session);
        return true;
    } catch (error) {
        console.error('Error updating session:', error);
        return false;
    }
}

// 유틸리티: 날짜 포맷팅
export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 유틸리티: 가격 포맷팅
export function formatPrice(price) {
    return parseInt(price).toLocaleString() + '원';
}

// 마감 여부 확인
export function isSessionExpired(session) {
    const deadline = new Date(session.deadline);
    return deadline < new Date();
}

// 남은 시간 계산
export function getTimeRemaining(deadline) {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end - now;
    
    if (diff <= 0) {
        return '마감됨';
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}시간 ${minutes}분 남음`;
    } else {
        return `${minutes}분 남음`;
    }
}

// 템플릿 관련 함수들 (LocalStorage 사용)
const TEMPLATE_KEY = 'menudamgi_templates';

export function getAllTemplates() {
    const data = localStorage.getItem(TEMPLATE_KEY);
    return data ? JSON.parse(data) : [];
}

export function saveTemplate(template) {
    const templates = getAllTemplates();
    const index = templates.findIndex(t => t.id === template.id);
    
    if (index >= 0) {
        templates[index] = template;
    } else {
        templates.push(template);
    }
    
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
}

export function deleteTemplate(templateId) {
    const templates = getAllTemplates();
    const filtered = templates.filter(t => t.id !== templateId);
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(filtered));
}

console.log('🔥 Firebase 초기화 완료!');

