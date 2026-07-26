Это действительно более удачный вариант. Причем я бы не ограничивался "сделай страницу". Для Claude Code лучше написать полноценную **Product Requirements Document (PRD)**, чтобы он сразу генерировал качественную архитектуру, а не набор HTML-файлов.

Я бы разделил разработку примерно на 10 этапов.

---

# PRD

## Interactive Tire Factory Digital Twin

### Цель

Разработать интерактивную HTML-демонстрацию производства автомобильной шины.

Назначение:

* демонстрация клиентам APS/MRP
* обучение сотрудников
* конференции
* демонстрация Theory of Constraints
* объяснение Supply Planning

Это **не сайт**, а полноценная интерактивная визуализация.

---

# Основные требования

Получившееся приложение должно выглядеть на уровне

* Kinaxis
* SAP IBP Demo
* Siemens Plant Simulation
* AnyLogic Demo
* McKinsey Interactive Report

Не использовать Bootstrap.

Не использовать стандартные HTML-кнопки.

Все компоненты должны быть собственными.

---

# Технологии

React

TypeScript

Vite

SVG

Framer Motion

D3

Tailwind

Heroicons

Lottie

---

# Стиль

Белый фон

Очень много воздуха

Большие отступы

Большие SVG

Синий

Белый

Серый

Акцент

Красный

---

# Структура приложения

```
App

├── Header

├── Sidebar KPI

├── ProductionCanvas

├── ParameterPanel

└── Bottom Timeline
```

---

# Header

Содержит

```
Production Demo

Tire Manufacturing

Interactive Simulation
```

Справа

```
Play

Pause

Step

Reset
```

---

# KPI Panel

Живые карточки

```
Throughput

Cycle Time

WIP

Queue

Utilization

Bottleneck

Completed Tires
```

Все обновляется каждый кадр.

---

# Production Canvas

Самый большой компонент.

Во всю ширину.

SVG.

---

Здесь находятся машины.

```
Raw Material

↓

Mixer

↓

Extruder

↓

Calender

↓

Bead

↓

Assembly

↓

Green Tire Buffer

↓

Vulcanization

↓

Inspection

↓

Warehouse
```

---

Все машины нарисованы отдельно.

Не использовать PNG.

Только SVG.

---

# SVG Style

Не мультяшный.

Не реалистичный.

Semi-isometric.

Очень похож на

SAP

Kinaxis

Siemens

---

# Машины

Mixer

Показывает вращающиеся роторы.

---

Extruder

Лента движется.

---

Calender

Вращаются валы.

---

Assembly Drum

Вращается барабан.

---

Vulcanization Press

Открывается

Закрывается

Появляется пар.

---

Inspection

Сканер.

---

Warehouse

Появляются готовые шины.

---

# Material Flow

Каждая шина —

отдельный объект.

Например

```
class Tire

id

status

location

progress

animationState
```

---

Шина едет

между машинами.

---

# Animation

60 FPS

Использовать Framer Motion.

---

При перемещении

использовать easing.

---

# Timeline

Внизу

ползунок времени.

Можно двигать.

---

# Speed

0.5x

1x

2x

4x

---

# Parameter Panel

Можно менять

Mixer Time

Extruder Time

Assembly Time

Press Time

Inspection Time

Количество прессов

Размер партии

Размер буфера

---

# TOC Mode

Кнопка

Show TOC

После нажатия

Все станции становятся серыми.

Bottleneck становится красным.

Перед ним начинает расти очередь.

---

# Queue Animation

Каждая новая шина

встает в очередь.

Не телепортируется.

А плавно подъезжает.

---

# WIP

Показывать количество

на каждой станции.

---

# Utilization

Каждая машина имеет

индикатор

```
78%

95%

100%
```

---

# KPI Update

Каждые

100 ms

пересчитывать

Throughput

Lead Time

WIP

Queue

Utilization

---

# Throughput Chart

Справа

маленький

Line Chart

D3.

---

# Resource Colors

Idle

серый

Working

синий

Blocked

желтый

Starved

фиолетовый

Bottleneck

красный

---

# APS Mode

Кнопка

Show APS

Появляется

```
Orders

↓

Finite Scheduler

↓

Production Orders

↓

Resources

↓

Execution
```

---

# Bottleneck Example

Если

Assembly

2 min

Press

15 min

то

должна появиться очередь.

---

Если Presses

увеличить

с 4

до

8

очередь должна исчезнуть.

---

# Compare Mode

Split Screen

До

После

Можно сравнить.

---

# Presentation Mode

Автоматическая демонстрация

без участия пользователя.

---

# Narration

Сверху

появляются подписи

```
Rubber is mixed.

↓

Components are manufactured.

↓

The green tire is assembled.

↓

The tire enters vulcanization.

↓

Quality inspection begins.
```

---

# Assets

Все SVG

хранить

```
assets/

machines/

icons/

tires/

animations/
```

---

# Code Quality

Все компоненты

до

300 строк.

---

Все параметры

через

Context.

---

Не использовать

магические числа.

---

# Deliverables

```
npm install

npm run dev

npm run build
```

должны работать без ошибок.

---

# Stretch Goals

Добавить:

* режим DRP (распределение готовых шин по складам и клиентам);
* отображение производственных заказов (Production Orders);
* экспорт текущего состояния в SVG или PNG;
* подключаемые сценарии (JSON) для разных типов шин и производственных конфигураций.

## Что я бы добавил сверх этого PRD

С учетом того, что вы разрабатываете **in.plan** и часто используете демонстрации для APS, я бы сделал проект сразу как **универсальный движок визуализации производства**, а не только шин.

То есть добавить абстрактную модель:

```text
Factory
 ├── Resources
 ├── Buffers
 ├── Products
 ├── Routes
 ├── Orders
 └── Events
```

Тогда производство шин станет всего лишь одним сценарием (`tire-factory.json`). Позже вы сможете подключить производство напитков, металлопроката, фармацевтики или FMCG без изменения кода — достаточно будет заменить описание процесса. Это значительно повысит ценность проекта для демонстраций возможностей APS и Supply Planning.
