// VERSION: v1.2.8 | DATE: 2026-04-23 | Proxy GCS (allowlist mediabank_academy | mediabank_velohub); b64 no path = só codificação do texto do URL, não da imagem

(function () {
    'use strict';

    function getConquistasApiBase() {
        if (typeof window === 'undefined') return '/api';
        const h = window.location.hostname;
        const p = window.location.protocol;
        const port = window.location.port;
        const isLocal =
            h === 'localhost' ||
            h === '127.0.0.1' ||
            /^192\.168\.\d{1,3}\.\d{1,3}$/.test(h) ||
            /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h) ||
            /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(h);
        if (isLocal) {
            const hostPart = p + '//' + h;
            if (port === '3001') return (hostPart + '/api').replace(/\/$/, '');
            return (hostPart + ':3001/api').replace(/\/$/, '');
        }
        if (typeof window.getApiBaseUrl === 'function') {
            const b = String(window.getApiBaseUrl()).replace(/\/$/, '');
            if (/^https?:\/\//i.test(b)) return b;
        }
        return (p + '//' + h + (port ? ':' + port : '') + '/api').replace(/\/$/, '');
    }

    function utf8ToB64Url(s) {
        try {
            const bin = unescape(encodeURIComponent(s));
            return btoa(bin)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
        } catch (e) {
            return '';
        }
    }

    var GCS_PROXY_PATH_PREFIXES = ['/mediabank_academy/', '/mediabank_velohub/'];

    function gcsPublicUrlPathAllowed(pathname) {
        var p = String(pathname || '');
        for (var i = 0; i < GCS_PROXY_PATH_PREFIXES.length; i++) {
            var pref = GCS_PROXY_PATH_PREFIXES[i];
            if (p === pref.slice(0, -1) || p.indexOf(pref) === 0) return true;
        }
        return false;
    }

    /**
     * A imagem continua no GCS. O proxy no Express pede o ficheiro ao URL HTTPS guardado no doc.
     * base64url no path só embala o texto desse URL no endereço do GET (evita ?u= perdido em dev).
     */
    function badgeImageSrcForDisplay(rawUrl) {
        const url = (rawUrl || '').trim();
        if (!url) return '';
        try {
            const u = new URL(url);
            if (u.protocol !== 'https:') return url;
            if (u.hostname !== 'storage.googleapis.com') return url;
            if (!gcsPublicUrlPathAllowed(u.pathname)) return url;
            const b64 = utf8ToB64Url(url);
            if (!b64) return url;
            const base = getConquistasApiBase();
            return base + '/conquistas/badge-image/b64/' + b64;
        } catch (_) {
            return url;
        }
    }

    function readSessionEmail() {
        try {
            const raw = localStorage.getItem('veloacademy_user_session');
            if (raw) {
                const data = JSON.parse(raw);
                const u = data && data.user;
                if (u && u.email) return String(u.email).trim().toLowerCase();
            }
        } catch (e) {
            /* ignora */
        }
        try {
            const legacy = localStorage.getItem('userEmail');
            if (legacy) return String(legacy).trim().toLowerCase();
        } catch (e2) {
            /* ignora */
        }
        return '';
    }

    function formatDate(iso) {
        if (!iso) return '';
        try {
            const d = new Date(iso);
            if (Number.isNaN(d.getTime())) return '';
            return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (_) {
            return '';
        }
    }

    function setHint(el, text) {
        if (!el) return;
        if (text) {
            el.textContent = text;
            el.hidden = false;
        } else {
            el.textContent = '';
            el.hidden = true;
        }
    }

    function renderTemaCard(item) {
        const url = badgeImageSrcForDisplay((item.badgeIconUrl || item.temaTrophyIconUrl || '').trim());
        const title = (item.temaNome || item.quizID || 'Tema').trim();
        const labelDate = formatDate(item.approvedAt);
        const tier = (item.badgeCategoria && String(item.badgeCategoria).trim()) || '';

        const fig = document.createElement('figure');
        fig.className = 'conquistas-badge-card';

        const visual = document.createElement('div');
        visual.className = 'conquistas-badge-visual';
        if (url) {
            const img = document.createElement('img');
            img.className = 'conquistas-badge-img';
            img.src = url;
            img.alt = title;
            img.loading = 'lazy';
            visual.appendChild(img);
        } else {
            const ph = document.createElement('div');
            ph.className = 'conquistas-badge-placeholder';
            ph.setAttribute('aria-hidden', 'true');
            ph.innerHTML = '<i class="fas fa-book-open"></i>';
            visual.appendChild(ph);
        }

        const cap = document.createElement('figcaption');
        cap.className = 'conquistas-badge-caption';
        const nameEl = document.createElement('span');
        nameEl.className = 'conquistas-badge-name';
        nameEl.textContent = title;
        cap.appendChild(nameEl);
        if (tier) {
            const tierEl = document.createElement('span');
            tierEl.className = 'conquistas-badge-tier';
            tierEl.textContent = tier;
            cap.appendChild(tierEl);
        }
        const sub = document.createElement('span');
        sub.className = 'conquistas-badge-sub';
        sub.textContent = labelDate || '—';
        cap.appendChild(sub);

        fig.appendChild(visual);
        fig.appendChild(cap);
        return fig;
    }

    function renderModuloCard(item) {
        const url = badgeImageSrcForDisplay((item.badgeIconUrl || '').trim());
        const title = (item.moduleNome || item.moduleId || 'Módulo').trim();
        const curso = (item.cursoNome || '').trim();
        const labelDate = formatDate(item.completedAt);

        const fig = document.createElement('figure');
        fig.className = 'conquistas-badge-card';

        const visual = document.createElement('div');
        visual.className = 'conquistas-badge-visual';
        if (url) {
            const img = document.createElement('img');
            img.className = 'conquistas-badge-img';
            img.src = url;
            img.alt = title;
            img.loading = 'lazy';
            visual.appendChild(img);
        } else {
            const ph = document.createElement('div');
            ph.className = 'conquistas-badge-placeholder';
            ph.setAttribute('aria-hidden', 'true');
            ph.innerHTML = '<i class="fas fa-layer-group"></i>';
            visual.appendChild(ph);
        }

        const cap = document.createElement('figcaption');
        cap.className = 'conquistas-badge-caption';
        const nameEl = document.createElement('span');
        nameEl.className = 'conquistas-badge-name';
        nameEl.textContent = title;
        const sub = document.createElement('span');
        sub.className = 'conquistas-badge-sub';
        sub.textContent = labelDate || '—';
        cap.appendChild(nameEl);
        if (curso) {
            const courseEl = document.createElement('span');
            courseEl.className = 'conquistas-badge-course';
            courseEl.textContent = curso;
            cap.appendChild(courseEl);
        }
        cap.appendChild(sub);

        fig.appendChild(visual);
        fig.appendChild(cap);
        return fig;
    }

    function renderExcelenciaCard(item) {
        const url = badgeImageSrcForDisplay((item.trophy_url || '').trim());
        const title = (item.conquista_titulo || 'Conquista').trim();
        const xpRaw = item.xpClass;
        const xpLabel =
            xpRaw != null && xpRaw !== '' && !Number.isNaN(Number(xpRaw))
                ? String(xpRaw).trim()
                : '';

        const fig = document.createElement('figure');
        fig.className = 'conquistas-badge-card conquistas-badge-card--excelencia';

        const visual = document.createElement('div');
        visual.className = 'conquistas-badge-visual';
        if (url) {
            const img = document.createElement('img');
            img.className = 'conquistas-badge-img';
            img.src = url;
            img.alt = title;
            img.loading = 'lazy';
            visual.appendChild(img);
        } else {
            const ph = document.createElement('div');
            ph.className = 'conquistas-badge-placeholder';
            ph.setAttribute('aria-hidden', 'true');
            ph.innerHTML = '<i class="fas fa-award"></i>';
            visual.appendChild(ph);
        }

        const cap = document.createElement('figcaption');
        cap.className = 'conquistas-badge-caption';
        const nameEl = document.createElement('span');
        nameEl.className = 'conquistas-badge-name';
        nameEl.textContent = title;
        cap.appendChild(nameEl);
        if (xpLabel !== '') {
            const xpEl = document.createElement('span');
            xpEl.className = 'conquistas-badge-xp';
            xpEl.textContent = 'XP ' + xpLabel;
            cap.appendChild(xpEl);
        }

        fig.appendChild(visual);
        fig.appendChild(cap);
        return fig;
    }

    function renderEmpty(msg) {
        const p = document.createElement('p');
        p.className = 'conquistas-badges-empty';
        p.textContent = msg;
        return p;
    }

    async function loadBadges() {
        const gridT = document.getElementById('conquistas-temas-grid');
        const gridM = document.getElementById('conquistas-modulos-grid');
        const gridE = document.getElementById('conquistas-excelencia-grid');
        const hintT = document.getElementById('conquistas-temas-hint');
        const hintM = document.getElementById('conquistas-modulos-hint');
        const hintE = document.getElementById('conquistas-excelencia-hint');
        if (!gridT || !gridM) return;

        const email = readSessionEmail();
        if (!email) {
            gridT.innerHTML = '';
            gridM.innerHTML = '';
            if (gridE) gridE.innerHTML = '';
            gridT.appendChild(renderEmpty('Inicie sessão para ver as conquistas.'));
            gridM.appendChild(renderEmpty('Inicie sessão para ver as conquistas.'));
            if (gridE) gridE.appendChild(renderEmpty('Inicie sessão para ver as conquistas.'));
            return;
        }

        const base = getConquistasApiBase();
        const enc = encodeURIComponent(email);

        setHint(hintT, '');
        setHint(hintM, '');
        setHint(hintE, '');

        try {
            const fetches = [
                fetch(`${base}/conquistas/temas/${enc}`, { credentials: 'omit' }),
                fetch(`${base}/conquistas/modulos/${enc}`, { credentials: 'omit' })
            ];
            if (gridE) {
                fetches.push(fetch(`${base}/conquistas/excelencia/${enc}`, { credentials: 'omit' }));
            }
            const responses = await Promise.all(fetches);
            const rT = responses[0];
            const rM = responses[1];
            const rE = gridE ? responses[2] : null;

            const jT = await rT.json().catch(function () {
                return {};
            });
            const jM = await rM.json().catch(function () {
                return {};
            });
            const jE =
                rE && rE.json
                    ? await rE.json().catch(function () {
                          return {};
                      })
                    : {};

            gridT.innerHTML = '';
            gridM.innerHTML = '';
            if (gridE) gridE.innerHTML = '';

            if (!rT.ok || jT.success === false) {
                setHint(hintT, (jT && jT.error) || 'Não foi possível carregar os temas.');
                gridT.appendChild(renderEmpty('Sem dados de temas.'));
            } else {
                const temas = Array.isArray(jT.temas) ? jT.temas : [];
                if (!temas.length) {
                    gridT.appendChild(
                        renderEmpty(
                            'Ainda não há temas concluídos (quiz aprovado ou trilha sem quiz finalizada).'
                        )
                    );
                } else {
                    temas.forEach(function (item) {
                        gridT.appendChild(renderTemaCard(item));
                    });
                }
            }

            if (!rM.ok || jM.success === false) {
                setHint(hintM, (jM && jM.error) || 'Não foi possível carregar os módulos.');
                gridM.appendChild(renderEmpty('Sem dados de módulos.'));
            } else {
                const modulos = Array.isArray(jM.modulos) ? jM.modulos : [];
                if (!modulos.length) {
                    gridM.appendChild(
                        renderEmpty(
                            'Ainda não há módulos vencidos (todos os temas do módulo concluídos).'
                        )
                    );
                } else {
                    modulos.forEach(function (item) {
                        gridM.appendChild(renderModuloCard(item));
                    });
                }
            }

            if (gridE && hintE) {
                if (!rE || !rE.ok || jE.success === false) {
                    setHint(hintE, (jE && jE.error) || 'Não foi possível carregar a Excelência do Atendimento.');
                    gridE.appendChild(renderEmpty('Sem dados de excelência.'));
                } else {
                    const trophies = Array.isArray(jE.trophies) ? jE.trophies : [];
                    if (!trophies.length) {
                        gridE.appendChild(
                            renderEmpty('Nenhum troféu de excelência registado para este utilizador.')
                        );
                    } else {
                        trophies.forEach(function (item) {
                            gridE.appendChild(renderExcelenciaCard(item));
                        });
                    }
                }
            }
        } catch (e) {
            gridT.innerHTML = '';
            gridM.innerHTML = '';
            if (gridE) gridE.innerHTML = '';
            const msg = (e && e.message) || 'Erro de rede.';
            gridT.appendChild(renderEmpty(msg));
            gridM.appendChild(renderEmpty(msg));
            if (gridE) gridE.appendChild(renderEmpty(msg));
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadBadges);
    } else {
        loadBadges();
    }
})();
