// 메뉴담기 - 단체 주문 관리 시스템
// 로컬 스토리지 기반 데이터 관리

const STORAGE_KEY = 'menudamgi_sessions';

// 세션 코드 생성 (6자리 영문+숫자)
function generateSessionCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // 중복 체크
    const sessions = getAllSessions();
    const exists = sessions.some(s => s.id === code);
    if (exists) {
        return generateSessionCode(); // 재귀적으로 다시 생성
    }
    return code;
}

// 모든 세션 가져오기
function getAllSessions() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// 특정 세션 가져오기
function getSession(sessionId) {
    const sessions = getAllSessions();
    return sessions.find(s => s.id === sessionId);
}

// 세션 저장
function saveSession(session) {
    const sessions = getAllSessions();
    
    // 기존 세션 업데이트 또는 새 세션 추가
    const index = sessions.findIndex(s => s.id === session.id);
    if (index >= 0) {
        sessions[index] = session;
    } else {
        sessions.push(session);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// 세션에 주문 추가
function addOrderToSession(sessionId, order) {
    const session = getSession(sessionId);
    if (!session) {
        console.error('Session not found:', sessionId);
        return false;
    }
    
    session.orders.push(order);
    saveSession(session);
    return true;
}

// 세션에서 특정 사용자의 기존 주문 찾기
function findOrderByUserName(sessionId, userName) {
    const session = getSession(sessionId);
    if (!session) {
        return null;
    }
    
    return session.orders.find(order => order.userName === userName);
}

// 세션의 주문 업데이트 (같은 이름의 기존 주문 수정)
function updateOrderInSession(sessionId, userName, updatedOrder) {
    const session = getSession(sessionId);
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
    
    saveSession(session);
    return true;
}

// 세션 삭제
function deleteSession(sessionId) {
    const sessions = getAllSessions();
    const filtered = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

// 세션 업데이트
function updateSession(sessionId, updates) {
    const session = getSession(sessionId);
    if (!session) {
        return false;
    }
    
    Object.assign(session, updates);
    saveSession(session);
    return true;
}

// 유틸리티: 날짜 포맷팅
function formatDate(dateString) {
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
function formatPrice(price) {
    return parseInt(price).toLocaleString() + '원';
}

// 마감 여부 확인
function isSessionExpired(session) {
    const deadline = new Date(session.deadline);
    return deadline < new Date();
}

// 남은 시간 계산
function getTimeRemaining(deadline) {
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

// 디버그: 샘플 데이터 생성 (개발용)
function createSampleData() {
    const sampleSession = {
        id: 'SAMPLE',
        name: '금요일 저녁 주문',
        restaurant: '맘스터치',
        deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2시간 후
        menu: [
            { id: 1, name: '싸이버거', price: 5900 },
            { id: 2, name: '통새우버거', price: 6500 },
            { id: 3, name: '딥치즈버거', price: 5500 },
            { id: 4, name: '케이준감자', price: 2000 },
            { id: 5, name: '치즈스틱', price: 2500 }
        ],
        orders: [
            {
                id: 1,
                userName: '홍길동',
                items: [
                    { menuId: 1, menuName: '싸이버거', price: 5900, quantity: 1 },
                    { menuId: 4, menuName: '케이준감자', price: 2000, quantity: 1 }
                ],
                totalPrice: 7900,
                note: '양념 적게 부탁드려요',
                timestamp: new Date().toISOString()
            },
            {
                id: 2,
                userName: '김영희',
                items: [
                    { menuId: 2, menuName: '통새우버거', price: 6500, quantity: 1 },
                    { menuId: 5, menuName: '치즈스틱', price: 2500, quantity: 1 }
                ],
                totalPrice: 9000,
                note: '',
                timestamp: new Date().toISOString()
            }
        ],
        createdAt: new Date().toISOString()
    };
    
    saveSession(sampleSession);
    console.log('샘플 데이터가 생성되었습니다:', sampleSession);
}

// 로컬스토리지 초기화 (개발용)
function clearAllData() {
    if (confirm('모든 데이터를 삭제하시겠습니까?')) {
        localStorage.removeItem(STORAGE_KEY);
        alert('모든 데이터가 삭제되었습니다.');
        location.reload();
    }
}

// 콘솔 유틸리티
window.menudamgi = {
    createSample: createSampleData,
    clearAll: clearAllData,
    getSessions: getAllSessions,
    getSession: getSession
};

console.log('메뉴담기 시스템 로드 완료!');
console.log('개발자 도구: window.menudamgi.createSample() - 샘플 데이터 생성');
console.log('개발자 도구: window.menudamgi.clearAll() - 모든 데이터 삭제');

