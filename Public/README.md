# Imagens do Sistema de Quiz

Esta pasta contém as imagens utilizadas para exibir o resultado dos quizzes.

## Arquivos Necessários

### aprovado.png
- **Descrição**: Imagem exibida quando o usuário é aprovado no quiz
- **Formato**: PNG
- **Dimensões recomendadas**: 200x200px ou similar
- **Uso**: Exibida no resultado do quiz quando a pontuação é igual ou superior à nota mínima

### reprovado.png
- **Descrição**: Imagem exibida quando o usuário é reprovado no quiz
- **Formato**: PNG
- **Dimensões recomendadas**: 200x200px ou similar
- **Uso**: Exibida no resultado do quiz quando a pontuação é inferior à nota mínima

## Especificações Técnicas

- **Formato**: PNG (recomendado para transparência)
- **Tamanho máximo**: 200px de largura (será redimensionado automaticamente)
- **Estilo**: Imagens com bordas arredondadas e sombra
- **Responsividade**: Redimensionadas para 150px em dispositivos móveis

## Localização no Código

As imagens são referenciadas em:
- `js/veloacademy.js` - Função `showLocalQuizResult()`
- `css/styles.css` - Classes `.result-image` e `.result-status-image`
