# Инструкции по публикации в npm

Мы подготовили пакет `particle-hide-effect-1.0.0.tgz`, который готов к публикации в npm. Вот шаги для ручной публикации:

## Вариант 1: Авторизация и публикация текущего проекта

1. Откройте терминал и перейдите в директорию проекта
2. Выполните авторизацию в npm:
   ```bash
   npm login
   ```
3. Следуйте инструкциям в браузере для авторизации
4. После успешной авторизации, опубликуйте пакет:
   ```bash
   npm publish
   ```

## Вариант 2: Публикация сгенерированного пакета

1. Авторизуйтесь как описано выше
2. Затем выполните:
   ```bash
   npm publish particle-hide-effect-1.0.0.tgz
   ```

## Проверка публикации

После успешной публикации, вы можете проверить ее, выполнив:

```bash
npm view particle-hide-effect
```

Пакет также должен появиться на странице: https://www.npmjs.com/package/particle-hide-effect

## Использование пакета

После публикации, пакет можно будет установить с помощью:

```bash
npm install particle-hide-effect
```

И использовать в проекте:

```javascript
import ParticleEffect from 'particle-hide-effect';

const element = document.getElementById('your-element-id');
const effect = new ParticleEffect(element);
``` 