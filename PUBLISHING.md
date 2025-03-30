# Руководство по публикации

Это руководство описывает процесс публикации библиотеки `particle-hide-effect` в npm и настройки демо-страницы на GitHub Pages.

## Подготовка к публикации

1. Убедитесь, что вы заменили все плейсхолдеры в файлах:
   - В `package.json` замените "Your Name" на ваше имя
   - В `package.json` замените "yourusername" в полях "repository", "homepage" и "bugs" на ваше GitHub имя пользователя
   - В `LICENSE` замените "Your Name" на ваше имя

2. Убедитесь, что библиотека собирается без ошибок:
   ```bash
   npm run build
   ```

## Создание GitHub репозитория

1. Создайте новый репозиторий на GitHub с именем `particle-hide-effect`
2. Инициализируйте Git в локальном проекте:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/particle-hide-effect.git
   git push -u origin main
   ```

## Настройка GitHub Pages

1. Перейдите в настройки вашего репозитория на GitHub
2. В разделе "Pages" выберите "GitHub Actions" в качестве источника 
3. Все остальное настроено в файле `.github/workflows/deploy.yml`
4. После пуша в `main` ветку, GitHub Actions автоматически соберет и опубликует демо-страницу

## Публикация в npm

1. Войдите в свой npm аккаунт:
   ```bash
   npm login
   ```

2. Убедитесь, что пакет собирается корректно:
   ```bash
   npm run build
   ```

3. Опубликуйте пакет:
   ```bash
   npm publish
   ```

### Обновление пакета

Для публикации новой версии:

1. Обновите версию в `package.json`:
   ```bash
   npm version patch # или minor, или major
   ```

2. Соберите и опубликуйте:
   ```bash
   npm run build
   npm publish
   ```

## Проверка после публикации

1. Установите пакет в тестовом проекте:
   ```bash
   npm install particle-hide-effect
   ```

2. Пример импорта и использования:
   ```javascript
   import ParticleEffect from 'particle-hide-effect';
   
   const element = document.getElementById('my-element');
   const effect = new ParticleEffect(element);
   ```

3. Проверьте демо-страницу по адресу: https://yourusername.github.io/particle-hide-effect/demo 