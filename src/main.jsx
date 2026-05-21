import React, { useEffect, useMemo, useRef, useState, forwardRef } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import HTMLFlipBook from 'react-pageflip';
import {
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  LogOut,
  ImagePlus,
  BookOpen,
  Lock,
  ZoomIn,
  X,
  ExternalLink,
} from 'lucide-react';
import './style.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey && !String(supabaseUrl).includes('YOUR-PROJECT'));
const supabase = hasSupabase ? createClient(supabaseUrl, supabaseAnonKey) : null;

const sampleItems = [
  { id: 'cover', type: 'cover', title: 'PRCUP 표지', image_url: '/sample/cover.png', storage_path: null, sort_order: 0, visible: true },
  { id: 'p1', type: 'page', title: '1페이지', image_url: '/sample/page1.jpg', storage_path: null, sort_order: 1, visible: true },
  { id: 'p2', type: 'page', title: '2페이지', image_url: '/sample/page2.jpg', storage_path: null, sort_order: 2, visible: true },
  { id: 'p3', type: 'page', title: '3페이지', image_url: '/sample/page3.jpg', storage_path: null, sort_order: 3, visible: true },
  { id: 'p4', type: 'page', title: '4페이지', image_url: '/sample/page4.jpg', storage_path: null, sort_order: 4, visible: true },
];

function App() {
  const [route, setRoute] = useState(window.location.hash === '#admin' ? 'admin' : 'ebook');
  const [items, setItems] = useState(sampleItems);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash === '#admin' ? 'admin' : 'ebook');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const loadItems = async () => {
    if (!supabase) {
      const local = localStorage.getItem('prcup-ebook-pages');
      setItems(local ? JSON.parse(local) : sampleItems);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.from('ebook_pages').select('*').order('sort_order', { ascending: true });
    setLoading(false);
    if (error) {
      setMessage('데이터를 불러오지 못했습니다: ' + error.message);
      setItems(sampleItems);
      return;
    }
    setItems(data?.length ? data : sampleItems);
  };

  useEffect(() => {
    loadItems();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  const saveLocal = (next) => {
    setItems(next);
    localStorage.setItem('prcup-ebook-pages', JSON.stringify(next));
  };

  return (
    <div className="app">
     <header className="topbar">
  <a href="#ebook" className="brand">
    <span>PRCUP</span>
    <strong>E-Book Catalog</strong>
  </a>
  <nav>
    <a className={route === 'ebook' ? 'active' : ''} href="#ebook">E-북 보기</a>
    <a className={route === 'admin' ? 'active' : ''} href="#admin">관리자</a>
  </nav>
</header>
      {message && <div className="notice">{message}</div>}
      {loading && <div className="notice">불러오는 중...</div>}

      {route === 'admin' ? (
        <AdminPage items={items} setItems={saveLocal} reload={loadItems} session={session} setMessage={setMessage} />
      ) : (
        <EbookViewer items={items.filter((item) => item.visible)} />
      )}
    </div>
  );
}

function EbookViewer({ items }) {
  const cover = items.find((i) => i.type === 'cover');
  const pages = items.filter((i) => i.type === 'page').sort((a, b) => a.sort_order - b.sort_order);
  const bookRef = useRef(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [zoomItem, setZoomItem] = useState(null);

  const pageSheets = useMemo(() => {
    const list = [];
    if (cover) list.push({ ...cover, sheetType: 'cover' });
    pages.forEach((page) => list.push({ ...page, sheetType: 'page' }));
    if (pages.length % 2 === 1) {
      list.push({
        id: 'blank-last',
        type: 'blank',
        title: '빈 페이지',
        image_url: '',
        storage_path: null,
        sort_order: 9999,
        visible: true,
        sheetType: 'blank',
      });
    }
    return list;
  }, [cover, pages]);

  const sheetCount = Math.ceil(pageSheets.length / 2);
  const displayLabel = pageIndex === 0 ? '표지' : `${Math.min(pageIndex + 1, pageSheets.length)} / ${pageSheets.length}`;

  const goPrev = () => bookRef.current?.pageFlip()?.flipPrev();
  const goNext = () => bookRef.current?.pageFlip()?.flipNext();

  return (
    <main className="viewer-wrap">
      <div className="viewer-head">
        <div>
          <h1><BookOpen size={22} /> PRCUP E-Book</h1>
          <p>플립북 라이브러리 적용 · 표지는 단독으로 시작 · 드래그 넘김 · 확대 보기 지원</p>
        </div>
        <div className="viewer-controls">
          <button disabled={pageIndex === 0} onClick={goPrev}>이전</button>
          <b>{displayLabel}</b>
          <button disabled={pageIndex >= Math.max(pageSheets.length - 1, 0)} onClick={goNext}>다음</button>
        </div>
      </div>

      <section className="viewer advanced-viewer">
                <div className="flipbook-shell">
          {pageSheets.length ? (
            <HTMLFlipBook
key={pageSheets.map((p) => p.id).join('-')}
              ref={bookRef}
              width={560}
              height={780}
              size="stretch"
              minWidth={280}
              maxWidth={1200}
              minHeight={400}
              maxHeight={1000}
              maxShadowOpacity={0.35}
              showCover={true}
              drawShadow={true}
              flippingTime={900}
              usePortrait={true}
              startPage={0}
              autoSize={true}
              mobileScrollSupport={true}
              swipeDistance={30}
              clickEventForward={false}
              useMouseEvents={true}
              className="flipbook"
              onFlip={(e) => setPageIndex(e.data)}
            >
              {pageSheets.map((item) => (
                <FlipPage key={item.id} item={item} onZoom={setZoomItem} />
              ))}
            </HTMLFlipBook>
          ) : (
            <div className="empty-page large-empty">페이지가 없습니다.</div>
          )}
        </div>
      </section>

      {zoomItem && <ZoomModal item={zoomItem} onClose={() => setZoomItem(null)} />}
    </main>
  );
}

const FlipPage = forwardRef(function FlipPage({ item, onZoom }, ref) {
  const isBlank = item.type === 'blank' || !item.image_url;
  const isCover = item.sheetType === 'cover';
  return (
    <div className={`flip-page ${isCover ? 'is-cover' : ''}`} ref={ref} data-density={isCover ? 'hard' : 'soft'}>
      <div className="flip-page-inner">
        <div className={`sheet-card ${isCover ? 'cover-sheet' : ''}`}>
          <div className="sheet-toolbar">
            <span>{item.title}</span>
            {!isBlank && (
              <button
                className="zoom-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onZoom(item);
                }}
              >
                <ZoomIn size={15} /> 확대
              </button>
            )}
          </div>
          <div className="sheet-media">
            {isBlank ? <EmptyPage text="빈 페이지" /> : <img src={item.image_url} alt={item.title} />}
          </div>
        </div>
      </div>
    </div>
  );
});

function ZoomModal({ item, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="zoom-overlay" onClick={onClose}>
      <div className="zoom-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="zoom-head">
          <div>
            <strong>{item.title}</strong>
            <p>작은 글씨가 잘 보이도록 큰 화면으로 확대한 원본 보기입니다.</p>
          </div>
          <div className="zoom-head-actions">
            <a href={item.image_url} target="_blank" rel="noreferrer" className="open-origin">
              <ExternalLink size={15} /> 원본 열기
            </a>
            <button className="close-zoom" onClick={onClose}><X size={18} /></button>
          </div>
        </div>
        <div className="zoom-body">
          <img src={item.image_url} alt={item.title} />
        </div>
      </div>
    </div>
  );
}

function EmptyPage({ text }) {
  return <div className="empty-page">{text}</div>;
}

function AdminPage({ items, setItems, reload, session, setMessage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const cover = items.find((i) => i.type === 'cover');
  const pages = items.filter((i) => i.type === 'page').sort((a, b) => a.sort_order - b.sort_order);

  const login = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setMessage('Supabase 연결 전이라 데모 관리자 모드로 실행 중입니다. .env에 Supabase 값을 넣으면 실제 저장됩니다.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setMessage('로그인 실패: ' + error.message);
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  const addFiles = async (files, type) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    setBusy(true);

    if (!supabase) {
      let next = [...items];
      for (const file of list) {
        const item = {
          id: crypto.randomUUID(),
          type,
          title: type === 'cover' ? '표지' : `${next.filter((x) => x.type === 'page').length + 1}페이지`,
          image_url: URL.createObjectURL(file),
          storage_path: null,
          sort_order: type === 'cover' ? 0 : next.filter((x) => x.type === 'page').length + 1,
          visible: true,
        };
        if (type === 'cover') next = [item, ...next.filter((x) => x.type !== 'cover')];
        else next.push(item);
      }
      setItems(next);
      setBusy(false);
      return;
    }

    for (const [index, file] of list.entries()) {
      const ext = file.name.split('.').pop();
      const storagePath = `${type}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const upload = await supabase.storage.from('ebook-pages').upload(storagePath, file, { upsert: false });
      if (upload.error) {
        setMessage('업로드 실패: ' + upload.error.message);
        continue;
      }
      const { data: publicUrl } = supabase.storage.from('ebook-pages').getPublicUrl(storagePath);
      const sortOrder = type === 'cover' ? 0 : pages.length + index + 1;
      if (type === 'cover') {
        await supabase.from('ebook_pages').update({ visible: false }).eq('type', 'cover');
      }
      const insert = await supabase.from('ebook_pages').insert({
        type,
        title: type === 'cover' ? '표지' : `${sortOrder}페이지`,
        image_url: publicUrl.publicUrl,
        storage_path: storagePath,
        sort_order: sortOrder,
        visible: true,
      });
      if (insert.error) setMessage('DB 저장 실패: ' + insert.error.message);
    }
    setBusy(false);
    reload();
  };

  const updateItem = async (id, patch) => {
    if (!supabase) {
      setItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
      return;
    }
    const { error } = await supabase.from('ebook_pages').update(patch).eq('id', id);
    if (error) setMessage('수정 실패: ' + error.message);
    reload();
  };

  const removeItem = async (item) => {
    if (!confirm('삭제할까요?')) return;
    if (!supabase) {
      setItems(items.filter((i) => i.id !== item.id));
      return;
    }
    if (item.storage_path) await supabase.storage.from('ebook-pages').remove([item.storage_path]);
    const { error } = await supabase.from('ebook_pages').delete().eq('id', item.id);
    if (error) setMessage('삭제 실패: ' + error.message);
    reload();
  };

  const movePage = async (index, dir) => {
    const target = pages[index];
    const other = pages[index + dir];
    if (!target || !other) return;
    if (!supabase) {
      const nextPages = [...pages];
      [nextPages[index], nextPages[index + dir]] = [nextPages[index + dir], nextPages[index]];
      const reordered = nextPages.map((p, idx) => ({ ...p, sort_order: idx + 1 }));
      setItems([...(cover ? [cover] : []), ...reordered]);
      return;
    }
    await supabase.from('ebook_pages').update({ sort_order: other.sort_order }).eq('id', target.id);
    await supabase.from('ebook_pages').update({ sort_order: target.sort_order }).eq('id', other.id);
    reload();
  };

  if (supabase && !session) {
    return (
      <main className="admin-login">
        <form onSubmit={login}>
          <Lock size={34} />
          <h1>관리자 로그인</h1>
          <input placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="비밀번호" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button disabled={busy}>{busy ? '로그인 중...' : '로그인'}</button>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-wrap">
      <aside className="admin-side">
        <h1>관리자 페이지</h1>
        <p>표지와 본문 이미지를 올리고 순서를 바꾸면 E-북 페이지에 자동 반영됩니다.</p>
        {!hasSupabase && <div className="warn">현재는 데모 모드입니다. Supabase 연결 후 실제 저장됩니다.</div>}
        <label className="upload-box">
          <ImagePlus size={30} />
          <b>표지 교체</b>
          <input type="file" accept="image/*" hidden onChange={(e) => addFiles(e.target.files, 'cover')} />
        </label>
        <label className="upload-box gray">
          <Upload size={30} />
          <b>본문 페이지 추가</b>
          <input type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files, 'page')} />
        </label>
        {supabase && <button className="logout" onClick={logout}><LogOut size={16} /> 로그아웃</button>}
      </aside>

      <section className="admin-list">
        <h2>표지</h2>
        {cover ? <AdminRow item={cover} onUpdate={updateItem} onRemove={removeItem} fixed /> : <div className="empty-admin">표지를 등록하세요.</div>}

        <h2>본문 페이지 <small>{pages.length}장</small></h2>
        {pages.map((item, idx) => (
          <AdminRow
            key={item.id}
            item={item}
            index={idx}
            total={pages.length}
            onUpdate={updateItem}
            onRemove={removeItem}
            onMove={movePage}
          />
        ))}
      </section>
    </main>
  );
}

function AdminRow({ item, index, total, onUpdate, onRemove, onMove, fixed }) {
  return (
    <div className="admin-row">
      <img src={item.image_url} alt={item.title} />
      <div className="row-main">
        <input value={item.title} onChange={(e) => onUpdate(item.id, { title: e.target.value })} />
        <div className="row-actions">
          {!fixed && <button disabled={index === 0} onClick={() => onMove(index, -1)}><ArrowUp size={16} /></button>}
          {!fixed && <button disabled={index === total - 1} onClick={() => onMove(index, 1)}><ArrowDown size={16} /></button>}
          <button onClick={() => onUpdate(item.id, { visible: !item.visible })}><Eye size={15} /> {item.visible ? '노출' : '숨김'}</button>
          <button className="danger" onClick={() => onRemove(item)}><Trash2 size={15} /> 삭제</button>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
