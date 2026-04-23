// VERSION: v1.2.0 | DATE: 2026-04-23 | Conquistas: temas, módulos e Excelência do Atendimento (API + grids)

(function () {
    'use strict';

    function readSessionEmail() {
        try {
            const raw = localStorage.getItem('veloacademy_user_session');
            if (!raw) return '';
            const data = JSON.parse(raw);
            const u = data && data.user;
            return u && u.email ? String(u.email).trim() : '';
        } catch (e) {
            return '';
        }
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
        const url = (item.badgeIconUrl || '').trim();
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
            img.referrerPolicy = 'no-referrer';
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
        const url = (item.badgeIconUrl || '').trim();
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
            img.referrerPolicy = 'no-referrer';
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
        const url = (item.trophy_url || '').trim();
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
            img.referrerPolicy = 'no-referrer';
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

        const base = typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : '/api';
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
