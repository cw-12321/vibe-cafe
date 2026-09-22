/**
 * ==========================================================================
 * 바이브 카페 (Vibe Cafe) - script.js
 * 설명: 주문서 양식 제출 검증, 로컬 저장, 영수증 모달, 고품질 스타일 엑셀 시트 내보내기
 * ==========================================================================
 */

// 로컬 스토리지 키 이름 정의
const STORAGE_KEY = 'vibe_cafe_orders';

// 최근 주문 객체 임시 보관
let latestOrder = null;
let currentModalOrder = null;

// DOM 요소 참조 가져오기
const orderForm = document.getElementById('orderForm');
const btnReset = document.getElementById('btn-reset');
const alertBox = document.getElementById('alertBox');
const alertMessage = document.getElementById('alertMessage');
const btnViewResult = document.getElementById('btn-view-result');
const btnCheckLatest = document.getElementById('btnCheckLatest');
const historyList = document.getElementById('historyList');
const historyCount = document.getElementById('historyCount');
const btnClearHistory = document.getElementById('btnClearHistory');
const btnDownloadExcel = document.getElementById('btnDownloadExcel');
const btnDownloadSingleExcel = document.getElementById('btnDownloadSingleExcel');

// 모달 DOM 요소 참조
const resultModal = document.getElementById('resultModal');
const btnCloseModal = document.getElementById('btnCloseModal');
const confirmModal = document.getElementById('confirmModal');
const btnCancelClear = document.getElementById('btnCancelClear');
const btnConfirmClear = document.getElementById('btnConfirmClear');
const resOrderId = document.getElementById('resOrderId');
const resOrderTime = document.getElementById('resOrderTime');
const resUserName = document.getElementById('resUserName');
const resUserPhone = document.getElementById('resUserPhone');
const resUserEmail = document.getElementById('resUserEmail');
const resDrink = document.getElementById('resDrink');
const resSize = document.getElementById('resSize');
const resOptions = document.getElementById('resOptions');
const resRequest = document.getElementById('resRequest');

// 페이지 로드 시 기존 주문 목록 렌더링
document.addEventListener('DOMContentLoaded', () => {
  renderOrderHistory();

  // 기존 주문이 있다면 가장 최신 주문을 latestOrder로 지정
  const orders = getOrdersFromStorage();
  if (orders.length > 0) {
    latestOrder = orders[0];
    if (btnCheckLatest) {
      btnCheckLatest.style.display = 'inline-flex';
    }
  }
});

/**
 * 폼 제출 이벤트 핸들러
 */
orderForm.addEventListener('submit', (e) => {
  e.preventDefault(); // 기본 폼 제출 동작 방지

  // 1. 입력 필드 값 가져오기
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const drinkSelect = document.getElementById('drink');
  const requestInput = document.getElementById('request');

  const userName = nameInput.value.trim();
  const userEmail = emailInput.value.trim() || '미입력';
  const userPhone = phoneInput.value.trim() || '미입력';
  const selectedDrink = drinkSelect.value;
  const userRequest = requestInput.value.trim() || '없음';

  // 음료 선택 유효성 검사
  if (!selectedDrink) {
    window.alert('음료를 선택해주세요.');
    drinkSelect.focus();
    return;
  }

  // 2. 선택된 사이즈 가져오기 (라디오 버튼)
  const selectedSizeEl = document.querySelector('input[name="size"]:checked');
  const selectedSize = selectedSizeEl ? selectedSizeEl.value : 'M (보통)';

  // 3. 선택된 추가 옵션 목록 가져오기 (체크박스)
  const checkedOptionEls = document.querySelectorAll('input[name="option"]:checked');
  const selectedOptions = Array.from(checkedOptionEls).map((el) => el.value);
  const optionsString = selectedOptions.length > 0 ? selectedOptions.join(', ') : '선택 없음';

  // 4. 주문 일시 및 고유 주문번호 생성
  const now = new Date();
  const orderTime = formatDateTime(now);
  const orderNumber = `VB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(1000 + Math.random() * 9000))}`;

  // 5. 주문 데이터 객체 구성
  const newOrder = {
    id: Date.now(),
    orderNumber: orderNumber,
    orderTime: orderTime,
    userName: userName,
    userEmail: userEmail,
    userPhone: userPhone,
    drink: selectedDrink,
    size: selectedSize,
    options: optionsString,
    request: userRequest,
  };

  // 최근 주문 갱신
  latestOrder = newOrder;

  // 6. 브라우저 로컬 저장소에 저장
  saveOrderToStorage(newOrder);

  // 7. 주문 내역 목록 화면 갱신
  renderOrderHistory();

  // 8. 사용자 알림창 표시 (결과 확인 버튼 노출)
  if (alertMessage) {
    alertMessage.textContent = `${userName}님의 "${selectedDrink}(${selectedSize})" 주문이 정상 접수되었습니다. 아래 버튼을 눌러 주문 결과를 확인하세요.`;
  }
  if (alertBox) {
    alertBox.classList.add('active');
  }

  if (btnCheckLatest) {
    btnCheckLatest.style.display = 'inline-flex';
  }

  // 9. 폼 초기화 (사이즈는 기본 M으로 재설정)
  orderForm.reset();
  const defaultSize = document.getElementById('size-m');
  if (defaultSize) {
    defaultSize.checked = true;
  }
});

/**
 * 폼 리셋 버튼 클릭 시 기본값 복원
 */
btnReset.addEventListener('click', () => {
  setTimeout(() => {
    const defaultSize = document.getElementById('size-m');
    if (defaultSize) {
      defaultSize.checked = true;
    }
  }, 10);
});

/**
 * 주문 결과 확인 버튼 클릭 시 모달 열기
 */
if (btnViewResult) {
  btnViewResult.addEventListener('click', () => {
    if (latestOrder) {
      openResultModal(latestOrder);
    } else {
      window.alert('확인할 수 있는 주문 내역이 없습니다.');
    }
  });
}

/**
 * 최근 주문 결과 보기 상단 버튼 클릭
 */
if (btnCheckLatest) {
  btnCheckLatest.addEventListener('click', () => {
    if (latestOrder) {
      openResultModal(latestOrder);
    } else {
      const orders = getOrdersFromStorage();
      if (orders.length > 0) {
        latestOrder = orders[0];
        openResultModal(latestOrder);
      } else {
        window.alert('접수된 주문이 없습니다.');
      }
    }
  });
}

/**
 * 모달 닫기 버튼 이벤트
 */
if (btnCloseModal) {
  btnCloseModal.addEventListener('click', () => {
    closeResultModal();
  });
}

/**
 * 모달 배경 클릭 시 닫기
 */
if (resultModal) {
  resultModal.addEventListener('click', (e) => {
    if (e.target === resultModal) {
      closeResultModal();
    }
  });
}

// ESC 키 입력 시 모달 닫기
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (resultModal && resultModal.classList.contains('active')) {
      closeResultModal();
    }
    if (confirmModal && confirmModal.classList.contains('active')) {
      closeConfirmModal();
    }
  }
});

// 확인 모달 배경 클릭 시 닫기
if (confirmModal) {
  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
      closeConfirmModal();
    }
  });
}

// 확인 모달 취소 버튼
if (btnCancelClear) {
  btnCancelClear.addEventListener('click', () => {
    closeConfirmModal();
  });
}

// 확인 모달 최종 삭제 버튼
if (btnConfirmClear) {
  btnConfirmClear.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    latestOrder = null;
    currentModalOrder = null;
    closeConfirmModal();
    renderOrderHistory();
    if (alertBox) alertBox.classList.remove('active');
    if (btnCheckLatest) btnCheckLatest.style.display = 'none';
    if (btnDownloadExcel) btnDownloadExcel.style.display = 'none';
  });
}

function openConfirmModal() {
  if (confirmModal) {
    confirmModal.classList.add('active');
    confirmModal.setAttribute('aria-hidden', 'false');
  }
}

function closeConfirmModal() {
  if (confirmModal) {
    confirmModal.classList.remove('active');
    confirmModal.setAttribute('aria-hidden', 'true');
  }
}

/**
 * 주문 결과 영수증 모달 열기
 * @param {Object} order - 표시할 주문 데이터 객체
 */
function openResultModal(order) {
  if (!order || !resultModal) return;
  currentModalOrder = order;

  resOrderId.textContent = order.orderNumber || `#${order.id}`;
  resOrderTime.textContent = order.orderTime;
  resUserName.textContent = `${order.userName} 님`;
  resUserPhone.textContent = order.userPhone;
  resUserEmail.textContent = order.userEmail;
  resDrink.textContent = order.drink;
  resSize.textContent = order.size;
  resOptions.textContent = order.options;
  resRequest.textContent = order.request;

  resultModal.classList.add('active');
  resultModal.setAttribute('aria-hidden', 'false');
}

/**
 * 주문 결과 영수증 모달 닫기
 */
function closeResultModal() {
  if (resultModal) {
    resultModal.classList.remove('active');
    resultModal.setAttribute('aria-hidden', 'true');
  }
}

/**
 * 주문 내역 비우기 버튼 클릭
 */
if (btnClearHistory) {
  btnClearHistory.addEventListener('click', () => {
    const orders = getOrdersFromStorage();
    if (orders.length === 0) return;
    openConfirmModal();
  });
}

/**
 * 전체 주문 목록 엑셀 다운로드 버튼
 */
if (btnDownloadExcel) {
  btnDownloadExcel.addEventListener('click', () => {
    const orders = getOrdersFromStorage();
    if (orders.length === 0) {
      window.alert('다운로드할 주문 내역이 없습니다.');
      return;
    }
    const filename = `바이브카페_주문내역_${formatDateForFilename(new Date())}.xls`;
    exportStyledExcel(orders, filename, '바이브 카페 전체 주문 현황');
  });
}

/**
 * 단일 주문 영수증 모달 내 엑셀 다운로드 버튼
 */
if (btnDownloadSingleExcel) {
  btnDownloadSingleExcel.addEventListener('click', () => {
    if (!currentModalOrder) return;
    const filename = `바이브카페_주문서_${currentModalOrder.orderNumber || currentModalOrder.id}.xls`;
    exportStyledExcel([currentModalOrder], filename, `${currentModalOrder.userName}님의 주문 영수증`);
  });
}

/**
 * 로컬 스토리지에 신규 주문 추가
 */
function saveOrderToStorage(order) {
  const orders = getOrdersFromStorage();
  orders.unshift(order); // 최신 주문이 상단에 오도록 추가
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

/**
 * 로컬 스토리지에서 주문 목록 가져오기
 */
function getOrdersFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('로컬스토리지 읽기 에러:', e);
    return [];
  }
}

/**
 * 누적 주문 내역 화면 렌더링
 */
function renderOrderHistory() {
  if (!historyList) return;
  const orders = getOrdersFromStorage();

  if (historyCount) {
    historyCount.textContent = `${orders.length}건`;
  }

  if (orders.length === 0) {
    historyList.innerHTML = '<li class="empty-history">아직 접수된 주문이 없습니다.</li>';
    if (btnClearHistory) btnClearHistory.style.display = 'none';
    if (btnCheckLatest) btnCheckLatest.style.display = 'none';
    if (btnDownloadExcel) btnDownloadExcel.style.display = 'none';
    return;
  }

  if (btnClearHistory) btnClearHistory.style.display = 'inline-block';
  if (btnCheckLatest) btnCheckLatest.style.display = 'inline-flex';
  if (btnDownloadExcel) btnDownloadExcel.style.display = 'inline-flex';

  historyList.innerHTML = orders
    .map(
      (item) => `
    <li class="history-item" data-id="${item.id}" title="클릭하여 상세 영수증 보기">
      <div class="history-item-top">
        <span>☕ ${escapeHtml(item.drink)} (${escapeHtml(item.size)})</span>
        <span style="font-weight: 400; color: var(--spotify-silver);">${escapeHtml(item.userName)}님</span>
      </div>
      <div class="history-item-desc">
        <div><strong>옵션:</strong> ${escapeHtml(item.options)}</div>
        ${item.request !== '없음' ? `<div><strong>요청:</strong> ${escapeHtml(item.request)}</div>` : ''}
        <div style="font-size: 11.5px; color: var(--spotify-silver); margin-top: 6px; display: flex; justify-content: space-between; align-items: center;">
          <span>${escapeHtml(item.orderTime)}</span>
          <span style="color: var(--spotify-green); font-weight: 700; font-size: 12px; letter-spacing: 0.5px;">상세보기 ›</span>
        </div>
      </div>
    </li>
  `
    )
    .join('');

  // 개별 주문 카드 클릭 시 해당 주문 결과 영수증 모달 열기
  const items = historyList.querySelectorAll('.history-item');
  items.forEach((itemEl) => {
    itemEl.addEventListener('click', () => {
      const orderId = Number(itemEl.getAttribute('data-id'));
      const targetOrder = orders.find((o) => o.id === orderId);
      if (targetOrder) {
        openResultModal(targetOrder);
      }
    });
  });
}

/**
 * 고품격 스타일링된 Excel 스프레드시트 내보내기 함수
 * Microsoft Excel, 한셀, Google Sheets에서 즉시 완벽한 레이아웃/스타일/폰트/색상으로 렌더링됩니다.
 * @param {Array} orderDataList - 주문 객체 목록
 * @param {string} fileName - 저장될 파일 이름
 * @param {string} title - 시트 상단 헤더 타이틀
 */
function exportStyledExcel(orderDataList, fileName, title) {
  const generatedTime = formatDateTime(new Date());

  // 데이터 테이블 행 구성
  const rowsHtml = orderDataList
    .map((order, index) => {
      const isEven = index % 2 === 1;
      const bgStyle = isEven ? 'background-color: #fafbf9;' : 'background-color: #ffffff;';
      return `
      <tr style="${bgStyle}">
        <td style="border: 1px solid #d4d4d8; padding: 10px 12px; text-align: center; font-size: 11pt; color: #52525b;">${index + 1}</td>
        <td style="border: 1px solid #d4d4d8; padding: 10px 12px; text-align: center; font-size: 11pt; font-weight: bold; color: #181818; font-family: Consolas, monospace;">${escapeXml(order.orderNumber || String(order.id))}</td>
        <td style="border: 1px solid #d4d4d8; padding: 10px 12px; text-align: center; font-size: 10.5pt; color: #71717a;">${escapeXml(order.orderTime)}</td>
        <td style="border: 1px solid #d4d4d8; padding: 10px 12px; text-align: center; font-size: 11pt; font-weight: bold; color: #181818;">${escapeXml(order.userName)}</td>
        <td style="border: 1px solid #d4d4d8; padding: 10px 12px; text-align: center; font-size: 10.5pt; color: #52525b;">${escapeXml(order.userPhone)}</td>
        <td style="border: 1px solid #d4d4d8; padding: 10px 12px; text-align: left; font-size: 10.5pt; color: #52525b;">${escapeXml(order.userEmail)}</td>
        <td style="border: 1px solid #d4d4d8; padding: 10px 14px; text-align: left; font-size: 11pt; font-weight: bold; color: #115e59; background-color: #f0fdf4;">☕ ${escapeXml(order.drink)}</td>
        <td style="border: 1px solid #d4d4d8; padding: 10px 12px; text-align: center; font-size: 10.5pt; font-weight: bold; color: #181818;">${escapeXml(order.size)}</td>
        <td style="border: 1px solid #d4d4d8; padding: 10px 12px; text-align: left; font-size: 10pt; color: #52525b;">${escapeXml(order.options)}</td>
        <td style="border: 1px solid #d4d4d8; padding: 10px 12px; text-align: left; font-size: 10pt; color: #3f3f46;">${escapeXml(order.request)}</td>
      </tr>
    `;
    })
    .join('');

  // 고품격 Excel HTML/XML 템플릿
  const excelContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" 
      xmlns:x="urn:schemas-microsoft-com:office:excel" 
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>주문현황</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
            <x:Print>
              <x:ValidPrinterInfo/>
              <x:PaperSizeIndex>9</x:PaperSizeIndex>
              <x:HorizontalResolution>600</x:HorizontalResolution>
              <x:VerticalResolution>600</x:VerticalResolution>
            </x:Print>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body, table, td, th {
      font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Segoe UI', Arial, sans-serif;
    }
  </style>
</head>
<body style="margin: 20px; background-color: #ffffff;">
  <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;">
    <!-- 최상단 브랜드 배너 타이틀 -->
    <tr>
      <td colspan="10" style="background-color: #121212; color: #1ed760; font-size: 18pt; font-weight: bold; text-align: center; padding: 22px 10px; letter-spacing: 1.5px; border: 1px solid #121212;">
        ☕ ${escapeXml(title)}
      </td>
    </tr>
    <!-- 메타데이터 행 -->
    <tr style="background-color: #1f1f1f; color: #b3b3b3;">
      <td colspan="5" style="padding: 10px 16px; font-size: 10pt; text-align: left; border-left: 1px solid #121212; border-bottom: 2px solid #1ed760;">
        출력 일시: <span style="color: #ffffff; font-weight: bold;">${generatedTime}</span>
      </td>
      <td colspan="5" style="padding: 10px 16px; font-size: 10pt; text-align: right; border-right: 1px solid #121212; border-bottom: 2px solid #1ed760;">
        총 주문 건수: <span style="color: #1ed760; font-weight: bold; font-size: 11pt;">${orderDataList.length}건</span>
      </td>
    </tr>
    <tr><td colspan="10" style="height: 14px;"></td></tr>
    
    <!-- 테이블 메인 헤더 행 (Spotify/Modern Slate Dark Theme) -->
    <tr style="background-color: #27272a; color: #ffffff;">
      <th style="border: 1px solid #3f3f46; padding: 12px 10px; font-size: 11pt; font-weight: bold; text-align: center; width: 50px;">NO</th>
      <th style="border: 1px solid #3f3f46; padding: 12px 14px; font-size: 11pt; font-weight: bold; text-align: center; width: 160px;">주문번호</th>
      <th style="border: 1px solid #3f3f46; padding: 12px 14px; font-size: 11pt; font-weight: bold; text-align: center; width: 155px;">주문일시</th>
      <th style="border: 1px solid #3f3f46; padding: 12px 14px; font-size: 11pt; font-weight: bold; text-align: center; width: 100px;">주문자명</th>
      <th style="border: 1px solid #3f3f46; padding: 12px 14px; font-size: 11pt; font-weight: bold; text-align: center; width: 130px;">연락처</th>
      <th style="border: 1px solid #3f3f46; padding: 12px 16px; font-size: 11pt; font-weight: bold; text-align: left; width: 180px;">이메일</th>
      <th style="border: 1px solid #3f3f46; padding: 12px 16px; font-size: 11pt; font-weight: bold; text-align: left; width: 170px;">주문음료</th>
      <th style="border: 1px solid #3f3f46; padding: 12px 12px; font-size: 11pt; font-weight: bold; text-align: center; width: 85px;">사이즈</th>
      <th style="border: 1px solid #3f3f46; padding: 12px 16px; font-size: 11pt; font-weight: bold; text-align: left; width: 180px;">추가옵션</th>
      <th style="border: 1px solid #3f3f46; padding: 12px 16px; font-size: 11pt; font-weight: bold; text-align: left; width: 220px;">요청사항</th>
    </tr>

    <!-- 데이터 리스트 바디 -->
    ${rowsHtml}

    <tr><td colspan="10" style="height: 16px;"></td></tr>

    <!-- 서머리 및 푸터 행 -->
    <tr style="background-color: #f4f4f5; color: #71717a;">
      <td colspan="10" style="border: 1px solid #e4e4e7; padding: 12px 16px; font-size: 9.5pt; text-align: center; line-height: 1.6;">
        바이브 카페 (Vibe Coffee Roasters) • 시스템 자동 생성 주문 보고서 • 본 문서는 주문 관리 및 영수증 증빙용으로 활용하실 수 있습니다.
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // Blob 객체 생성 및 다운로드 트리거
  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 날짜 포맷 함수 (YYYY-MM-DD HH:mm:ss)
 */
function formatDateTime(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}-${m}-${d} ${h}:${mi}:${s}`;
}

/**
 * 파일명용 날짜 포맷 (YYYYMMDD_HHmmss)
 */
function formatDateForFilename(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}${m}${d}_${h}${mi}${s}`;
}

/**
 * XSS 방지용 HTML 이스케이프
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

/**
 * XML/Excel 특수문자 이스케이프
 */
function escapeXml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
