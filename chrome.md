# Chrome HTML 구조 명세

OHC Hub에 마운트되는 모든 서비스(svc)가 자신의 도메인에서 렌더링할 공통 헤더(chrome) HTML/CSS 구조입니다.

**핵심 원칙:**
- iframe 의존 ❌ (성능, 보안)
- 각 svc는 자신의 도메인에서 독립적으로 렌더링
- 공통 헤더는 svc가 각 프레임워크별로 직접 구현
- 허브에서 헤더 코드 제공 (스니펫)

---

## 1. 헤더 HTML 구조

```html
<header class="ohc-hub-chrome">
  <!-- 로고 영역 -->
  <div class="ohc-chrome-logo">
    <a href="https://hub.openhealthcare.com" class="ohc-logo-link">
      <svg class="ohc-logo-icon" width="32" height="32" viewBox="0 0 32 32">
        <!-- OHC 로고 SVG (base64 또는 외부 URL) -->
      </svg>
      <span class="ohc-logo-text">OHC Hub</span>
    </a>
  </div>

  <!-- 메뉴 영역 -->
  <nav class="ohc-chrome-nav">
    <ul class="ohc-nav-menu">
      <li class="ohc-nav-item">
        <a href="https://hub.openhealthcare.com/catalog" class="ohc-nav-link">
          카탈로그
        </a>
      </li>
      <li class="ohc-nav-item">
        <a href="https://hub.openhealthcare.com/my-services" class="ohc-nav-link">
          내 서비스
        </a>
      </li>
      <li class="ohc-nav-item">
        <a href="https://hub.openhealthcare.com/docs" class="ohc-nav-link">
          문서
        </a>
      </li>
    </ul>
  </nav>

  <!-- 사용자 메뉴 영역 -->
  <div class="ohc-chrome-user-menu">
    <div class="ohc-user-profile">
      <span class="ohc-user-name">사용자명</span>
      <img src="https://hub.openhealthcare.com/api/users/avatar" alt="프로필" class="ohc-user-avatar">
    </div>
    <div class="ohc-dropdown-menu">
      <a href="https://hub.openhealthcare.com/settings" class="ohc-dropdown-item">설정</a>
      <a href="https://hub.openhealthcare.com/logout" class="ohc-dropdown-item">로그아웃</a>
    </div>
  </div>
</header>

<!-- 메인 콘텐츠 -->
<main class="ohc-chrome-content">
  <!-- 서비스별 콘텐츠 -->
</main>
```

**거절 anchor:**
https://github.com/OPEN-Healthcare/ohc-changemgmt-hub-rules/blob/main/chrome.md#L7

---

## 2. 헤더 CSS 구조

```css
/* 기본 레이아웃 */
.ohc-hub-chrome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 로고 영역 */
.ohc-chrome-logo {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.ohc-logo-link {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: #1f2937;
  font-weight: 600;
  font-size: 14px;
  transition: color 0.2s ease;
}

.ohc-logo-link:hover {
  color: #0066cc;
}

.ohc-logo-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.ohc-logo-text {
  letter-spacing: -0.3px;
}

/* 메뉴 영역 */
.ohc-chrome-nav {
  flex: 1;
  display: flex;
  justify-content: center;
  margin: 0 32px;
}

.ohc-nav-menu {
  display: flex;
  gap: 32px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.ohc-nav-item {
  position: relative;
}

.ohc-nav-link {
  display: block;
  padding: 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  text-decoration: none;
  transition: color 0.2s ease;
  border-bottom: 2px solid transparent;
}

.ohc-nav-link:hover,
.ohc-nav-link[aria-current="page"] {
  color: #0066cc;
  border-bottom-color: #0066cc;
}

/* 사용자 메뉴 영역 */
.ohc-chrome-user-menu {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}

.ohc-user-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  background-color: #f9fafb;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.ohc-user-profile:hover {
  background-color: #f3f4f6;
}

.ohc-user-name {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
}

.ohc-user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #e5e7eb;
}

/* 드롭다운 메뉴 */
.ohc-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-width: 160px;
  display: none;
  z-index: 1000;
}

.ohc-user-profile:hover ~ .ohc-dropdown-menu,
.ohc-dropdown-menu:hover {
  display: block;
}

.ohc-dropdown-item {
  display: block;
  width: 100%;
  padding: 10px 16px;
  text-align: left;
  font-size: 13px;
  color: #374151;
  text-decoration: none;
  border: none;
  background: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid #f3f4f6;
}

.ohc-dropdown-item:last-child {
  border-bottom: none;
}

.ohc-dropdown-item:hover {
  background-color: #f9fafb;
  color: #0066cc;
}

/* 콘텐츠 영역 */
.ohc-chrome-content {
  padding: 24px;
  min-height: calc(100vh - 64px);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .ohc-hub-chrome {
    height: auto;
    flex-wrap: wrap;
    padding: 12px 16px;
    gap: 16px;
  }

  .ohc-chrome-nav {
    flex-basis: 100%;
    margin: 0;
    justify-content: flex-start;
    overflow-x: auto;
  }

  .ohc-nav-menu {
    gap: 16px;
  }

  .ohc-nav-link {
    font-size: 12px;
  }

  .ohc-user-name {
    display: none;
  }

  .ohc-dropdown-menu {
    right: auto;
    left: 0;
  }

  .ohc-chrome-content {
    padding: 12px;
  }
}
```

---

## 3. 프레임워크별 구현 (스니펫)

### React / Next.js

```typescript
// components/OhcChrome.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface ChromeProps {
  userEmail: string;
  userName: string;
  children: React.ReactNode;
}

export function OhcChrome({ userEmail, userName, children }: ChromeProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <>
      <header className="ohc-hub-chrome">
        <div className="ohc-chrome-logo">
          <Link href="https://hub.openhealthcare.com" className="ohc-logo-link">
            <svg className="ohc-logo-icon" width="32" height="32" viewBox="0 0 32 32">
              {/* SVG content */}
            </svg>
            <span className="ohc-logo-text">OHC Hub</span>
          </Link>
        </div>

        <nav className="ohc-chrome-nav">
          <ul className="ohc-nav-menu">
            <li className="ohc-nav-item">
              <a href="https://hub.openhealthcare.com/catalog" className="ohc-nav-link">
                카탈로그
              </a>
            </li>
            <li className="ohc-nav-item">
              <a href="https://hub.openhealthcare.com/my-services" className="ohc-nav-link">
                내 서비스
              </a>
            </li>
            <li className="ohc-nav-item">
              <a href="https://hub.openhealthcare.com/docs" className="ohc-nav-link">
                문서
              </a>
            </li>
          </ul>
        </nav>

        <div className="ohc-chrome-user-menu">
          <div className="ohc-user-profile" onClick={() => setShowUserMenu(!showUserMenu)}>
            <span className="ohc-user-name">{userName}</span>
            <Image
              src={`https://hub.openhealthcare.com/api/users/avatar?email=${userEmail}`}
              alt="프로필"
              className="ohc-user-avatar"
              width={32}
              height={32}
            />
          </div>
          {showUserMenu && (
            <div className="ohc-dropdown-menu">
              <a href="https://hub.openhealthcare.com/settings" className="ohc-dropdown-item">
                설정
              </a>
              <a href="https://hub.openhealthcare.com/logout" className="ohc-dropdown-item">
                로그아웃
              </a>
            </div>
          )}
        </div>
      </header>

      <main className="ohc-chrome-content">{children}</main>

      <style jsx global>{`
        /* CSS 코드 위의 .ohc-hub-chrome 부터 시작 */
      `}</style>
    </>
  );
}

// 사용 예
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <OhcChrome userEmail="user@example.com" userName="사용자명">
      {children}
    </OhcChrome>
  );
}
```

### NestJS + EJS (서버 렌더링)

```typescript
// views/chrome.ejs
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= title %></title>
  <style>
    /* CSS 코드 */
  </style>
</head>
<body>
  <header class="ohc-hub-chrome">
    <div class="ohc-chrome-logo">
      <a href="https://hub.openhealthcare.com" class="ohc-logo-link">
        <svg class="ohc-logo-icon" width="32" height="32" viewBox="0 0 32 32">
          <!-- SVG content -->
        </svg>
        <span class="ohc-logo-text">OHC Hub</span>
      </a>
    </div>

    <nav class="ohc-chrome-nav">
      <ul class="ohc-nav-menu">
        <li class="ohc-nav-item">
          <a href="https://hub.openhealthcare.com/catalog" class="ohc-nav-link">
            카탈로그
          </a>
        </li>
        <li class="ohc-nav-item">
          <a href="https://hub.openhealthcare.com/my-services" class="ohc-nav-link">
            내 서비스
          </a>
        </li>
        <li class="ohc-nav-item">
          <a href="https://hub.openhealthcare.com/docs" class="ohc-nav-link">
            문서
          </a>
        </li>
      </ul>
    </nav>

    <div class="ohc-chrome-user-menu">
      <div class="ohc-user-profile">
        <span class="ohc-user-name"><%= userName %></span>
        <img src="https://hub.openhealthcare.com/api/users/avatar?email=<%= userEmail %>" alt="프로필" class="ohc-user-avatar">
      </div>
      <div class="ohc-dropdown-menu">
        <a href="https://hub.openhealthcare.com/settings" class="ohc-dropdown-item">설정</a>
        <a href="https://hub.openhealthcare.com/logout" class="ohc-dropdown-item">로그아웃</a>
      </div>
    </div>
  </header>

  <main class="ohc-chrome-content">
    <%- body %>
  </main>
</body>
</html>
```

---

## 4. 통합 체크리스트

**svc 개발자가 chrome 적용 시 확인 사항:**

- [ ] Chrome HTML 구조를 자신의 프레임워크로 구현했는가?
- [ ] 로고/메뉴/사용자 메뉴 모두 동작하는가?
- [ ] 헤더가 sticky position으로 스크롤해도 고정되는가?
- [ ] 반응형 디자인 테스트 (mobile/tablet/desktop)
- [ ] CSS가 svc 자체 스타일과 충돌하지 않는가?
- [ ] iframe 의존성이 없는가?
- [ ] 링크/메뉴 항목이 외부 도메인(hub.openhealthcare.com)을 정확히 가리키는가?

---

## 5. 알려진 함정

**Chrome 로그인 상태:**
- Hub에서 로그인하면 JWT 토큰이 발급됨
- 각 svc는 자신의 도메인에서 독립적으로 토큰 검증해야 함
- 헤더의 "로그아웃" 링크 클릭 시 Hub 로그아웃 + 모든 svc 세션 삭제 필요

**도메인 간 쿠키:**
- 도메인이 다르면 쿠키 자동 공유 ❌
- Bearer token (Authorization header)로 인증 구현
- 필요시 CORS 설정 (hub.openhealthcare.com CORS 화이트리스트)

**CSS 스코핑:**
- Chrome CSS가 svc CSS를 덮어쓸 수 있음
- CSS-in-JS 라이브러리 사용 권장 (styled-components, Emotion 등)
- 또는 BEM/OOCSS 네이밍 규칙으로 충돌 방지
