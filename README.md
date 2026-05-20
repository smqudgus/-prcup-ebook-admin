# PRCUP E-Book 관리자형 카탈로그

구성:

- `#ebook` : 고객이 보는 E-Book 화면
- `#admin` : 관리자 화면
- Supabase 연결 전에는 샘플/데모 모드로 작동
- Supabase 연결 후에는 이미지 업로드, 순서 변경, 노출/숨김, 삭제가 실제 저장됨

## 1. 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 안내되는 주소로 접속합니다.

## 2. Supabase 연결 방법

### 1) Supabase 프로젝트 생성

Supabase에서 새 프로젝트를 만듭니다.

### 2) SQL 실행

`supabase/schema.sql` 파일 안의 내용을 Supabase SQL Editor에 붙여넣고 실행합니다.

생성되는 것:

- `ebook_pages` 테이블
- `ebook-pages` Storage bucket
- 읽기/쓰기 정책

### 3) 관리자 계정 생성

Supabase의 Authentication 메뉴에서 관리자 이메일을 생성합니다.

### 4) 환경변수 입력

`.env.example` 파일을 복사해서 `.env` 파일로 만들고 값을 넣습니다.

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

Supabase 프로젝트의 `Project Settings > API`에서 확인할 수 있습니다.

### 5) 다시 실행

```bash
npm run dev
```

이후 `#admin`에서 로그인하면 실제 관리자 기능을 사용할 수 있습니다.

## 3. Vercel 배포

GitHub에 이 폴더를 올린 뒤 Vercel에서 프로젝트를 연결합니다.

Vercel의 Environment Variables에 아래 2개를 추가합니다.

```env
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## 4. 운영 방식

관리자 페이지에서:

1. 표지 이미지 교체
2. 본문 페이지 이미지 추가
3. 위/아래 버튼으로 순서 변경
4. 노출/숨김 설정
5. 삭제

저장된 내용은 고객용 E-Book 화면에 자동 반영됩니다.

## 5. 주의

- 상품 4,000개를 이미지 페이지로만 운영하면 이미지 용량이 커질 수 있습니다.
- 나중에는 상품명, 규격, 박스입수, 가격을 DB에 넣고 자동 카탈로그로 뿌리는 구조가 더 좋습니다.
