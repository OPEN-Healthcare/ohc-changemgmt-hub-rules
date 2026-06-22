# OWASP Top 10 (2021) 보안 명세

AI가 서비스 코드 작성 시 반드시 회피해야 할 OWASP Top 10 취약점 10가지입니다.

---

## A01:2021 – Broken Access Control (접근 제어 실패)

**설명:**
사용자가 허용된 권한을 초과하여 기능/데이터에 접근할 수 있는 취약점.

**거절 anchor:**
https://github.com/OPEN-Healthcare/ohc-changemgmt-hub-rules/blob/main/owasp-top10.md#L7

**금지 케이스:**
- 권한 검증 없이 직접 URL로 리소스 접근 (예: `/api/patients/{patientId}` 권한 체크 없음)
- 역할 기반 접근 제어(RBAC) 미구현 (예: 일반 사용자가 관리자 기능 호출)
- 객체 참조 직접 노출 (예: `/invoices/123` → 다른 사용자의 송장)
- 세션/토큰 검증 누락

**우회 방법:**
- 모든 리소스 접근 전 권한 검증: `if (!user.canAccess(resource)) throw UnauthorizedError()`
- 토큰/세션 검증: middleware에서 필수 검증
- 객체 참조 암호화: UUID/opaque token 사용
- 필드 레벨 권한: API 응답에서 민감한 필드 제거

**NestJS 예시:**
```typescript
@UseGuards(JwtAuthGuard, RoleGuard)
@Post('invoices')
async create(@User() user: UserDto, @Body() dto: CreateInvoiceDto) {
  if (user.role !== 'ADMIN' && user.role !== 'ACCOUNTANT') {
    throw new ForbiddenException('Insufficient permissions');
  }
  return this.invoiceService.create(dto);
}
```

---

## A02:2021 – Cryptographic Failures (암호화 실패)

**설명:**
민감한 데이터가 전송 중 또는 저장 중 보호되지 않는 취약점.

**거절 anchor:**
https://github.com/OPEN-Healthcare/ohc-changemgmt-hub-rules/blob/main/owasp-top10.md#L37

**금지 케이스:**
- HTTPS 미사용 (HTTP로 민감한 데이터 전송)
- 약한 암호화 알고리즘 사용 (예: MD5, SHA1, DES)
- 평문 패스워드/API 키 저장
- 암호화 키가 소스 코드에 하드코딩
- TLS 버전 < 1.2

**우회 방법:**
- 전송: 반드시 HTTPS/TLS 1.2 이상 사용
- 저장: AES-256-GCM 암호화 (대칭키), RSA-2048+ (공개키)
- 패스워드: bcrypt/Argon2 해시 (솔트 필수)
- 키 관리: 환경변수/시크릿 관리 서비스 사용 (예: AWS Secrets Manager, .env)

**NestJS 예시:**
```typescript
import * as bcrypt from 'bcrypt';

async hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10); // 10 라운드 권장
}

async verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

---

## A03:2021 – Injection (주입 공격)

**설명:**
신뢰할 수 없는 데이터가 명령어/쿼리에 직접 삽입되는 취약점. SQL, NoSQL, OS 명령어 포함.

**거절 anchor:**
https://github.com/OPEN-Healthcare/ohc-changemgmt-hub-rules/blob/main/owasp-top10.md#L67

**금지 케이스:**
- SQL 쿼리에 사용자 입력을 직접 연결 (예: `SELECT * FROM users WHERE id = ${req.body.id}`)
- MongoDB 쿼리에 객체 병합 (예: `db.collection.find({...req.body})`)
- 동적 명령어 실행 (예: `child_process.exec('rm ' + userFile)`)
- LDAP/XPath 쿼리에 입력 미검증

**우회 방법:**
- SQL: 파라미터화 쿼리(Prepared Statements) 필수
- MongoDB: 필드명/값 화이트리스트 검증 후 쿼리
- OS 명령어: 절대 사용하지 말 것, 필요시 라이브러리 함수 사용
- 입력 검증: Zod/Joi로 schema validation

**NestJS 예시 (SQL - TypeORM):**
```typescript
// ❌ 위험: 직접 쿼리
const result = await connection.query(`SELECT * FROM users WHERE id = ${id}`);

// ✅ 안전: 파라미터화
const result = await connection.query('SELECT * FROM users WHERE id = ?', [id]);

// ✅ 안전: ORM 사용
const user = await this.userRepository.findOne({ where: { id } });
```

**MongoDB 예시:**
```typescript
// ❌ 위험: 사용자 객체 직접 병합
const user = await this.userModel.findOne(req.body);

// ✅ 안전: 필드 검증 후 쿼리
const validatedQuery = {
  email: req.body.email,
  status: req.body.status // 화이트리스트 필드만
};
const user = await this.userModel.findOne(validatedQuery);
```

---

## A04:2021 – Insecure Design (안전하지 않은 설계)

**설명:**
보안을 고려하지 않은 아키텍처 및 설계 결함.

**거절 anchor:**
https://github.com/OPEN-Healthcare/ohc-changemgmt-hub-rules/blob/main/owasp-top10.md#L101

**금지 케이스:**
- 비밀번호 복구 메커니즘 미흡 (예: 보안 질문만 사용)
- Rate limiting 없음 (brute force 공격 가능)
- 자동 로그아웃 기능 부재 (세션 탈취 위험)
- 다단계 인증(MFA) 없음 (특히 어드민)
- API 문서가 공개되어 엔드포인트 노출

**우회 방법:**
- 비밀번호 복구: 이메일 검증 + 시간 제한 토큰 (1시간)
- Rate limiting: 로그인 5회 실패 → 15분 차단
- 세션 관리: 30분 무활동 → 자동 로그아웃, refresh token 사용
- MFA: 어드민은 필수, 일반 사용자는 선택
- API 문서: 내부 wiki/private repo에만 공개

---

## A05:2021 – Security Misconfiguration (보안 미설정)

**설명:**
기본값/불완전한 설정으로 인한 보안 결함.

**거절 anchor:**
https://github.com/OPEN-Healthcare/ohc-changemgmt-hub-rules/blob/main/owasp-top10.md#L127

**금지 케이스:**
- 기본 계정/암호 변경 안 함 (예: admin/admin)
- 불필요한 포트 노출 (예: 3000 포트 방화벽 미설정)
- 디버그 모드 활성화 상태 배포
- 에러 메시지에 스택 트레이스 노출
- 보안 헤더 미설정 (X-Frame-Options, CSP 등)
- 민감한 정보를 .env에 평문 저장 후 git commit

**우회 방법:**
- 모든 기본 계정 변경, 불필요한 계정 삭제
- 방화벽: 필요한 포트만 개방
- 프로덕션: 디버그 모드 OFF, NODE_ENV=production
- 에러 처리: 일반적 메시지만 반환 (상세 로그는 서버에만 저장)
- 보안 헤더 추가: helmet.js 미들웨어
- .env 예외: .gitignore에 추가, 환경변수로만 관리

**NestJS 예시:**
```typescript
import helmet from 'helmet';

app.use(helmet()); // HSTS, X-Frame-Options 등 자동 설정

// 에러 필터
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : 500;
    
    // 프로덕션: 상세 정보 숨김
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : exception.toString();
    
    response.status(status).json({ message });
  }
}
```

---

## A06:2021 – Vulnerable and Outdated Components (취약한 의존성)

**설명:**
알려진 보안 취약점이 있는 라이브러리/프레임워크 사용.

**거절 anchor:**
https://github.com/OPEN-Healthcare/ohc-changemgmt-hub-rules/blob/main/owasp-top10.md#L165

**금지 케이스:**
- npm 패키지 버전 고정 없음 (package.json에 `*` 또는 `>=` 사용)
- `npm audit`에서 HIGH/CRITICAL 취약점 무시
- 5년 이상 업데이트 안 된 라이브러리 사용
- 라이브러리 보안 공지(CVE) 미모니터링

**우회 방법:**
- 정확한 버전 고정: `package.json`에 `^x.y.z` 또는 `~x.y.z` 사용
- 정기 감시: `npm audit fix` (월 1회 이상)
- 보안 업데이트 즉시 적용: Dependabot/Snyk 활용
- 라이브러리 선택: 활발한 유지보수 + 많은 다운로드 확인

---

## A07:2021 – Identification and Authentication Failures (인증 실패)

**설명:**
약한 인증 메커니즘으로 인한 사용자 신원 확인 실패.

**거절 anchor:**
https://github.com/OPEN-Healthcare/ohc-changemgmt-hub-rules/blob/main/owasp-top10.md#L189

**금지 케이스:**
- 세션 ID가 예측 가능 (예: 순차 번호)
- 비밀번호 정책 미흡 (최소 길이, 복잡도 체크 없음)
- 기본 인증 사용 (HTTP Basic Auth를 평문으로)
- 다단계 인증 없음
- JWT 토큰이 만료되지 않음 (no exp 클레임)
- 비밀번호 초기화 링크가 보안되지 않음

**우회 방법:**
- 세션 ID: 암호학적으로 안전한 난수 생성 (uuid v4 이상)
- 비밀번호: 최소 12자, 대소문자 + 숫자 + 특수문자 권장
- 토큰: Bearer token (Authorization header) 사용
- JWT: exp, iat, 서명 필수
- MFA: TOTP(Time-based OTP) 또는 SMS 코드
- 비밀번호 초기화: 1시간 유효 토큰 + 이메일 확인

**NestJS 예시:**
```typescript
import { v4 as uuid } from 'uuid';

// 안전한 세션 ID
const sessionId = uuid();

// JWT 설정
const token = this.jwtService.sign(
  { sub: user.id, role: user.role },
  {
    expiresIn: '1h',
    issuer: 'ohc-auth',
    audience: 'ohc-services'
  }
);
```

---

## A08:2021 – Software and Data Integrity Failures (소프트웨어/데이터 무결성 실패)

**설명:**
업데이트, CI/CD 파이프라인, 의존성 관리 시 데이터 무결성 검증 부재.

**거절 anchor:**
https://github.com/OPEN-Healthcare/ohc-changemgmt-hub-rules/blob/main/owasp-top10.md#L219

**금지 케이스:**
- 코드 서명/검증 없이 배포
- CI/CD 파이프라인 로그 공개
- 패키지 매니저 입력 검증 없음
- 자동 업데이트 무한정 허용 (패키지 버전)
- 바이너리 파일 체크섬 검증 안 함

**우회 방법:**
- 모든 배포는 서명된 커밋만 수용
- CI/CD 로그: 민감 정보 마스크, 접근 제어
- package.json lock 파일 사용 (package-lock.json / pnpm-lock.yaml)
- 수동 코드 리뷰: 배포 전 모든 변경 검토
- 바이너리 검증: SHA256 체크섬 확인

---

## A09:2021 – Logging and Monitoring Failures (로깅/모니터링 실패)

**설명:**
보안 사건 감지 및 대응 능력 부재.

**거절 anchor:**
https://github.com/OPEN-Healthcare/ohc-changemgmt-hub-rules/blob/main/owasp-top10.md#L245

**금지 케이스:**
- 로그에 PII(주민등록번호, 패스워드, API 키) 기록
- 보안 이벤트 미로깅 (로그인 실패, 권한 거부 등)
- 실시간 알림 미설정 (보안 담당자 수동 확인만)
- 로그 삭제/변조 가능
- 로그 보관 기간 너무 짧음 (감사 추적 불가)

**우회 방법:**
- 로그에서 PII 마스킹: `password: "****"`, `ssn: "***-****"`
- 보안 이벤트 로깅: 로그인 시도(성공/실패), 권한 거부, 데이터 접근
- 실시간 알림: 로그 수집 → 분석 → Slack/이메일 통보
- 로그 무결성: 중앙 로그 저장소 + 쓰기 전용 모드
- 보관 기간: 최소 1년 (규제 요구사항 확인)

**NestJS 예시:**
```typescript
// 로그에서 민감 정보 마스킹
function maskSensitiveData(data: any): any {
  const masked = { ...data };
  if (masked.password) masked.password = '****';
  if (masked.ssn) masked.ssn = masked.ssn.slice(0, 6) + '****';
  if (masked.phone) masked.phone = masked.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  return masked;
}

// 보안 이벤트 로깅
async login(email: string, password: string) {
  try {
    const user = await this.userService.findByEmail(email);
    if (!user || !await this.verifyPassword(password, user.passwordHash)) {
      this.logger.warn(`Login failed for email: ${email}`, 'AuthService');
      return { success: false };
    }
    this.logger.log(`Login success for email: ${email}`, 'AuthService');
    return { success: true, token: this.generateToken(user) };
  } catch (error) {
    this.logger.error(`Login error for email: ${email}`, error, 'AuthService');
    throw error;
  }
}
```

---

## A10:2021 – Server-Side Request Forgery (SSRF)

**설명:**
서버가 사용자 입력으로 인해 의도하지 않은 외부 요청을 보내는 취약점.

**거절 anchor:**
https://github.com/OPEN-Healthcare/ohc-changemgmt-hub-rules/blob/main/owasp-top10.md#L281

**금지 케이스:**
- 사용자가 제공한 URL을 검증 없이 요청 (예: `fetch(req.body.url)`)
- 메타데이터 서비스 노출 (AWS IMDSv1: `http://169.254.169.254/latest/meta-data/`)
- 내부 IP 대역 요청 가능 (예: `http://192.168.x.x`)
- 리다이렉트 따라가기 활성화

**우회 방법:**
- URL 화이트리스트: 허용된 도메인만 요청
- 내부 IP 차단: 요청 전 IP 검증 (127.0.0.1, 169.254.x.x, 10.0.0.0/8 등)
- DNS rebinding 방지: 재검증 (resolve → fetch 재확인)
- 리다이렉트 제한: 최대 1~2회로 제한
- 타임아웃 설정: 5초 이상 응답 없으면 중단

**NestJS 예시:**
```typescript
import { isIP } from 'net';

async fetchExternalUrl(url: string): Promise<any> {
  // 화이트리스트 검증
  const allowedDomains = ['api.example.com', 'cdn.example.com'];
  const urlObj = new URL(url);
  if (!allowedDomains.some(domain => urlObj.hostname.endsWith(domain))) {
    throw new BadRequestException('URL not in whitelist');
  }

  // 내부 IP 차단
  const ip = await dns.promises.resolve4(urlObj.hostname);
  if (isPrivateIP(ip[0])) {
    throw new BadRequestException('Internal IP blocked');
  }

  // 안전한 요청
  const response = await axios.get(url, { 
    timeout: 5000,
    maxRedirects: 1 // 최소 리다이렉트
  });
  
  return response.data;
}

function isPrivateIP(ip: string): boolean {
  return /^(127\.|192\.168\.|10\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[01]\.)/.test(ip);
}
```

---

## 종합 원칙

**AI 코드 작성 시 체크리스트:**

- [ ] A01: 모든 엔드포인트에 권한 검증 추가
- [ ] A02: 민감한 데이터는 HTTPS + 암호화
- [ ] A03: 모든 사용자 입력은 파라미터화 또는 ORM 사용
- [ ] A04: 비밀번호 복구, Rate limiting, MFA 고려
- [ ] A05: 보안 헤더(helmet), NODE_ENV=production, .env .gitignore
- [ ] A06: npm audit, lock 파일, 버전 관리
- [ ] A07: 강한 세션/토큰, JWT exp, MFA
- [ ] A08: 서명된 배포, CI/CD 보안
- [ ] A09: PII 마스킹, 보안 이벤트 로깅
- [ ] A10: URL 화이트리스트, 내부 IP 차단, DNS rebinding 방지

모든 항목은 **구현 필수** 입니다. 거절 불가 항목입니다.
