import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * 内容集合定义：src/content/ 下每个子文件夹对应一个集合。
 * 每个 .md 文件的 frontmatter 必须符合这里定义的字段。
 */

/** 项目经历：每个项目一个 .md 文件 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),                 // 项目名称
    date: z.coerce.date(),             // 完成日期（决定排序）
    type: z.string().default('独立游戏'), // 项目类型
    platform: z.string().default('PC'),  // 平台
    role: z.string().default('游戏策划'), // 我的角色
    teamSize: z.string().default('个人'), // 团队规模
    duration: z.string().default('4 周'), // 周期
    cover: z.string().optional(),      // 封面图（放 public/images/projects/ 下）
    demoUrl: z.string().optional(),    // 演示 / 视频 / 下载链接
    demoLabel: z.string().optional(),  // 演示按钮文案（如「下载 Demo（约 150MB · 网盘）」）
    videoUrl: z.string().optional(),   // 演示视频链接（B站等），如 https://www.bilibili.com/video/BVxxxx
    planDoc: z.string().optional(),    // 关联策划案文档链接（如 /docs/fairytale-plan/）
    featured: z.boolean().default(false), // 是否首页精品项目
    tags: z.array(z.string()).default([]),
    summary: z.string(),               // 列表卡片上的一句话简介
  }),
});

/**
 * 策划文档：拆解案 / 策划案 / 剧本 / 对白 / 世界观。
 * 页面展示顺序：拆解案、策划案置顶，其余（剧本/对白/世界观）归为「剧本文档」一类。
 */
const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.enum(['拆解案', '策划案', '剧本', '对白', '世界观']).default('策划案'),
    /** 文档类型细分（如 完整 / 节选 / 习作 / 正文待补），剧本类用 */
    kind: z.string().optional(),
    summary: z.string(),
    pdf: z.string().optional(), // 可选：PDF / 云文档链接
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { projects, docs };
