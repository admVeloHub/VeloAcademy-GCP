# Diretrizes de Integração - VeloAcademy

## Visão Geral
Este documento contém as diretrizes para integrar uma nova página/aba ao projeto VeloAcademy, garantindo consistência visual e funcional com o design existente.

## Estrutura do Projeto

### Arquivos Principais
- `index.html` - Página inicial
- `cursos.html` - Página de cursos
- `css/styles.css` - Estilos principais
- `js/veloacademy.js` - JavaScript principal

### Navegação
O projeto possui uma navegação consistente com as seguintes abas:
- Home (`index.html`)
- Cursos (`cursos.html`)
- Conquistas (`conquistas.html`)
- Auto Feedback (`auto-feedback.html`)
- VeloHub (link externo)

## Padrões de Design

### Cores (CSS Variables)
```css
:root {
    --cor-fundo: #f0f4f8;
    --cor-container: #ffffff;
    --cor-card: #ffffff;
    --cor-texto-principal: #071a2f;
    --cor-texto-secundario: #5a677e;
    --cor-accent: #007bff;
    --cor-borda: rgba(0, 0, 0, 0.1);
    --cor-sombra: rgba(0, 0, 0, 0.1);
}
```

### Tema Escuro
```css
[data-theme="dark"] {
    --cor-fundo: #0a1929;
    --cor-container: #112240;
    --cor-card: #1d3557;
    --cor-texto-principal: #e6f1ff;
    --cor-texto-secundario: #a8b2d1;
    --cor-accent: #4dabf7;
    --cor-borda: rgba(77, 171, 247, 0.2);
    --cor-sombra: rgba(0, 0, 0, 0.4);
}
```

### Tipografia
- **Fonte**: Poppins (Google Fonts)
- **Títulos**: font-weight: 600
- **Tamanhos**: h1 (2.2rem), h2, h3 com pesos variados

### Layout Base
```html
<!DOCTYPE html>
<html lang="pt-BR" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Título da Página] - VeloAcademy</title>
    <link rel="stylesheet" href="./css/styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css">
    <link rel="icon" type="image/png" href="./academy.png">
</head>
<body>
    <header>
        <!-- Header padrão -->
    </header>
    
    <main>
        <div class="container main-container">
            <!-- Conteúdo da página -->
        </div>
    </main>
    
    <script src="./js/veloacademy.js"></script>
</body>
</html>
```

## Header Padrão
```html
<header>
    <div class="container header-container">
        <div class="logo" id="logo-container">
            <img id="logo-image" class="logo-image" src="./academy.png" alt="VeloAcademy Logo">
        </div>
        
        <nav class="nav-menu">
            <a href="./index.html" class="nav-link">Home</a>
            <a href="./cursos.html" class="nav-link">Cursos</a>
            <a href="./conquistas.html" class="nav-link">Conquistas</a>
            <a href="./auto-feedback.html" class="nav-link">Auto Feedback</a>
            <a href="https://velohub.vercel.app" class="nav-link" target="_blank">VeloHub</a>
        </nav>

        <div class="theme-switch-wrapper" id="theme-toggle">
            <i class='bx bx-sun theme-icon'></i>
            <i class='bx bx-moon theme-icon'></i>
        </div>
    </div>
</header>
```

## Componentes Reutilizáveis

### Cards
```css
.dashboard-card {
    background-color: var(--cor-card);
    border-radius: var(--borda-raio);
    padding: var(--espaco);
    box-shadow: 0 4px 12px var(--cor-sombra);
    border: 1px solid var(--cor-borda);
}
```

### Botões
```css
.btn {
    padding: 12px 24px;
    border-radius: var(--borda-raio);
    text-decoration: none;
    font-weight: 500;
    transition: all 0.3s ease;
}

.btn-primary {
    background-color: var(--cor-accent);
    color: white;
}

.btn-secondary {
    background-color: transparent;
    color: var(--cor-accent);
    border: 1px solid var(--cor-accent);
}
```

### Seções
```css
.section {
    margin: 40px 0;
    padding: 20px;
}

.section h2 {
    margin-bottom: 20px;
    color: var(--cor-texto-principal);
}
```

## Responsividade
- Container principal: `max-width: none`
- Padding lateral: `20px`
- Breakpoints: Mobile-first approach
- Flexbox para layouts responsivos

## Funcionalidades JavaScript
- Toggle de tema claro/escuro
- Navegação ativa
- Interações dinâmicas

## Checklist de Integração
- [ ] Usar estrutura HTML base
- [ ] Incluir header padrão com navegação
- [ ] Aplicar variáveis CSS para cores
- [ ] Usar fonte Poppins
- [ ] Implementar tema escuro
- [ ] Manter responsividade
- [ ] Incluir logo e favicon
- [ ] Testar em diferentes dispositivos
- [ ] Verificar acessibilidade
- [ ] Manter consistência com outras páginas

