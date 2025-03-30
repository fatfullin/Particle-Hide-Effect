# Публикация пакета с префиксом (scope)

Если имя `particle-hide-effect` уже занято, вы можете создать пакет с префиксом вашего npm аккаунта:

## 1. Изменение имени пакета

Отредактируйте `package.json` и измените имя пакета на:

```json
{
  "name": "@ваш_npm_username/particle-hide-effect",
  ...
}
```

Например, если ваш npm username `fatfullin`:

```json
{
  "name": "@fatfullin/particle-hide-effect",
  ...
}
```

## 2. Публикация scoped пакета

По умолчанию scoped пакеты являются приватными. Для публикации в общедоступном режиме, используйте флаг `--access public`:

```bash
npm publish --access public
```

## 3. Использование scoped пакета

После публикации, пакет можно будет установить с помощью:

```bash
npm install @ваш_npm_username/particle-hide-effect
```

И использовать в проекте:

```javascript
import ParticleEffect from '@ваш_npm_username/particle-hide-effect';

const element = document.getElementById('your-element-id');
const effect = new ParticleEffect(element);
``` 