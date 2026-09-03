---
title: 童话冒险 DEMO
date: 2026-08-31
type: 独立游戏（单人）
platform: PC · Godot
role: 制作人 / 主策划
teamSize: 个人（AI 辅助编程）
duration: 序章可玩 Demo
featured: true
cover: /images/projects/fairytale/01-title.jpg
planDoc: /docs/fairytale-plan/
demoUrl: 'https://pan.baidu.com/s/1L2zQ2hUVPqM05ViGb74iow?pwd=abee'
demoLabel: '下载 Demo（约 150MB · 百度网盘）'
videoUrl: 'https://www.bilibili.com/video/BV1oJtu6tEs9/'
tags: [JRPG, 回合制, 系统策划, 数值策划]
summary: 用 Godot + AI 辅助编程独立完成的回合制 JRPG 序章。主导世界观、剧情与数值设计，统筹战斗、装备等系统落地。
---

# 童话冒险 DEMO

## 概况
一对兄妹汉斯与安娜穿越童话世界、寻找母亲、击败恶魔的回合制战斗 RPG。640×360 像素、16×16 像素风、仿 GBA/SFC 音乐，剧情基调清新明快、略藏黑暗伏笔。叙事气质参考了《地球冒险（EarthBound）》系列。

## 我的角色
单人制作人：主导世界观、剧情与数值设计，统筹战斗、装备、队伍、背包、存档、商店等系统落地，并通过「制作人把控框架 → 主脑 AI 拆解任务卡 → 助手 AI 执行 → 联合验收」的协作流程完成序章可玩内容。

## 实机截图

<div class="shot-grid">

![标题画面](/images/projects/fairytale/01-title.jpg)
![战斗 · 距离机制](/images/projects/fairytale/04-distance.jpg)
![战斗 · 护卫机制](/images/projects/fairytale/07-guard.jpg)
![角色技能面板（含伤害公式）](/images/projects/fairytale/10-skill-panel.jpg)
![商店界面](/images/projects/fairytale/05-shop.jpg)
![序章剧情 · 魔女环](/images/projects/fairytale/06-story.jpg)
![新手引导 · WASD 移动](/images/projects/fairytale/02-move-tutorial.jpg)
![JRPG 经典对话](/images/projects/fairytale/08-jrpg-talk.jpg)

</div>

## 战斗系统流程图

![战斗系统流程图](/images/projects/fairytale/flowchart.jpg)

## 设计亮点
- **战斗系统**：速度排行动序、攻/技/道/防/逃五指令、明雷遇敌、多敌人战斗、敌人 8 种 AI 范式（鲁莽 / 逼近者 / 规律技击 / 随机技击 / 蓄力怪 / 间歇跳过 / 远程压制 / 权重随机）。
- **距离机制**：近/中距离站位，击退/拉近改变距离，中距离攻击受命中惩罚。
- **数值公式**：物理伤害 = max(攻击力×0.6 − 防御力×0.4, 攻击力×0.15)；命中率 = clamp(85% + 灵巧差×2% − 距离惩罚, 5%, 100%)。

> DEMO 视频（B 站）与完整主策划案将在后续补充；全部文档 / Demo 打包下载见[策划文档页](/docs/)的网盘入口。