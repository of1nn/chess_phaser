# Шахматная игра на Phaser 3

Это проект шахматной игры, разработанный с использованием фреймворка Phaser 3.

## Описание

chess_phaser - это интерактивная шахматная игра, созданная с помощью JavaScript и фреймворка Phaser 3. Игра предоставляет классический шахматный опыт с современным интерфейсом и дополнительными функциями.

## Особенности

- Классическая шахматная доска и фигуры
- Поддержка всех стандартных шахматных правил
- Интуитивно понятный пользовательский интерфейс
- Возможность игры против компьютера или другого игрока
- Система подсветки возможных ходов
- Запись истории ходов

## Технологии

- JavaScript
- Phaser 3
- HTML5
- CSS3

## Установка

Для запуска проекта на локальном компьютере выполните следующие шаги:

1. Клонируйте репозиторий:
   ```
   git clone https://github.com/your-username/chess_phaser.git
   ```

2. Перейдите в директорию проекта:
   ```
   cd chess_phaser
   ```

3. Установите зависимости:
   ```
   npm install
   ```

4. Запустите сборку проекта:
   ```
   npm run build
   ```

5. Запустите сервер для разработки:
   ```
   npx webpack serve
   ```

6. Откройте браузер и перейдите по адресу `http://localhost:8080`

## Использование

После запуска игры вы увидите шахматную доску. Используйте мышь для выбора и перемещения фигур. Игра автоматически проверяет правильность ходов и соблюдение шахматных правил.

## Структура проекта

- `src/` - исходный код игры
  - `scenes/` - сцены Phaser
  - `objects/` - игровые объекты (фигуры, доска)
  - `utils/` - вспомогательные функции
- `assets/` - графические и звуковые ресурсы
- `index.html` - главная HTML страница
- `main.js` - точка входа в приложение
