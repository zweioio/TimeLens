import { DomainMeta } from '../types';

export class TagDatabase {
  // 内置的 Top 50 网站标签映射表
  private static defaultDatabase: Record<string, Omit<DomainMeta, 'domain' | 'isCustomized'>> = {
    // Work (工作类)
    'figma.com': { tags: ['Work', 'Tools'], primaryTag: 'Work' },
    'notion.so': { tags: ['Work', 'Tools'], primaryTag: 'Work' },
    'github.com': { tags: ['Work', 'Tools'], primaryTag: 'Work' },
    'jira.com': { tags: ['Work', 'Tools'], primaryTag: 'Work' },
    'google.com': { tags: ['Work', 'Tools'], primaryTag: 'Tools' },
    'docs.google.com': { tags: ['Work', 'Tools'], primaryTag: 'Work' },
    'slack.com': { tags: ['Work', 'Social'], primaryTag: 'Work' },
    'zoom.us': { tags: ['Work', 'Tools'], primaryTag: 'Work' },
    'trello.com': { tags: ['Work', 'Tools'], primaryTag: 'Work' },
    'canva.com': { tags: ['Work', 'Tools'], primaryTag: 'Work' },
    
    // AI (人工智能)
    'chatgpt.com': { tags: ['AI', 'Work'], primaryTag: 'AI' },
    'openai.com': { tags: ['AI', 'Work'], primaryTag: 'AI' },
    'gemini.google.com': { tags: ['AI', 'Work'], primaryTag: 'AI' },
    'midjourney.com': { tags: ['AI', 'Work', 'Photography'], primaryTag: 'AI' },
    'jimeng.jianying.com': { tags: ['AI', 'Work', 'Video'], primaryTag: 'AI' },
    'claude.ai': { tags: ['AI', 'Work'], primaryTag: 'AI' },
    'huggingface.co': { tags: ['AI', 'Work'], primaryTag: 'AI' },
    
    // Social (社交)
    'twitter.com': { tags: ['Social', 'News'], primaryTag: 'Social' },
    'x.com': { tags: ['Social', 'News'], primaryTag: 'Social' },
    'xiaohongshu.com': { tags: ['Social', 'Entertainment'], primaryTag: 'Social' },
    'instagram.com': { tags: ['Social', 'Photography'], primaryTag: 'Social' },
    'reddit.com': { tags: ['Social', 'News', 'Entertainment'], primaryTag: 'Social' },
    'facebook.com': { tags: ['Social'], primaryTag: 'Social' },
    'weibo.com': { tags: ['Social', 'News', 'Entertainment'], primaryTag: 'Social' },
    'linkedin.com': { tags: ['Social', 'Work'], primaryTag: 'Social' },
    'discord.com': { tags: ['Social', 'Games'], primaryTag: 'Social' },
    
    // Entertainment & Video (娱乐与影视)
    'youtube.com': { tags: ['Video', 'Entertainment', 'Music'], primaryTag: 'Video' },
    'bilibili.com': { tags: ['Video', 'Entertainment', 'Books'], primaryTag: 'Video' },
    'tiktok.com': { tags: ['Entertainment', 'Video'], primaryTag: 'Entertainment' },
    'netflix.com': { tags: ['Video', 'Entertainment'], primaryTag: 'Video' },
    '9gag.com': { tags: ['Entertainment'], primaryTag: 'Entertainment' },
    'twitch.tv': { tags: ['Video', 'Games', 'Entertainment'], primaryTag: 'Video' },
    'hulu.com': { tags: ['Video', 'Entertainment'], primaryTag: 'Video' },
    
    // Music (音乐)
    'spotify.com': { tags: ['Music', 'Entertainment'], primaryTag: 'Music' },
    'music.163.com': { tags: ['Music', 'Entertainment'], primaryTag: 'Music' },
    'soundcloud.com': { tags: ['Music', 'Entertainment'], primaryTag: 'Music' },
    
    // Shopping (购物)
    'amazon.com': { tags: ['Shopping'], primaryTag: 'Shopping' },
    'taobao.com': { tags: ['Shopping'], primaryTag: 'Shopping' },
    'jd.com': { tags: ['Shopping'], primaryTag: 'Shopping' },
    'shopify.com': { tags: ['Shopping', 'Work'], primaryTag: 'Shopping' },
    
    // Books & Reading (阅读与知识)
    'wikipedia.org': { tags: ['Books', 'Tools'], primaryTag: 'Books' },
    'medium.com': { tags: ['Books', 'News'], primaryTag: 'Books' },
    'zhihu.com': { tags: ['Books', 'Social', 'Entertainment'], primaryTag: 'Books' },
    'z-lib.org': { tags: ['Books', 'Tools'], primaryTag: 'Books' },
    
    // Games (游戏)
    'crazygames.com': { tags: ['Games', 'Entertainment'], primaryTag: 'Games' },
    'steampowered.com': { tags: ['Games', 'Shopping'], primaryTag: 'Games' },
    
    // Photography & Design (摄影与设计)
    'unsplash.com': { tags: ['Photography', 'Tools'], primaryTag: 'Photography' },
    'behance.net': { tags: ['Photography', 'Work'], primaryTag: 'Photography' },
    'pinterest.com': { tags: ['Photography', 'Social'], primaryTag: 'Photography' }
  };

  /**
   * 获取域名的标签元数据
   * @param domain 要查询的域名 (如 'figma.com')
   * @returns 包含 tags 和 primaryTag 的对象
   */
  public static getTags(domain: string): { tags: string[], primaryTag: string } {
    // 1. 尝试直接从内置数据库中获取
    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
    
    if (this.defaultDatabase[normalizedDomain]) {
      return {
        tags: [...this.defaultDatabase[normalizedDomain].tags],
        primaryTag: this.defaultDatabase[normalizedDomain].primaryTag
      };
    }

    // 2. 如果未命中，基于域名关键词进行简单推断
    return this.inferTagsFromDomain(normalizedDomain);
  }

  /**
   * 基于域名关键词进行简单推断
   * @param domain 域名
   */
  private static inferTagsFromDomain(domain: string): { tags: string[], primaryTag: string } {
    const inferredTags: string[] = [];
    let primaryTag = 'Tools'; // 默认主标签

    if (domain.includes('mail') || domain.includes('drive')) {
      inferredTags.push('Work', 'Tools');
      primaryTag = 'Work';
    } else if (domain.includes('news') || domain.includes('post') || domain.includes('times')) {
      inferredTags.push('News');
      primaryTag = 'News';
    } else if (domain.includes('shop') || domain.includes('store') || domain.includes('buy')) {
      inferredTags.push('Shopping');
      primaryTag = 'Shopping';
    } else if (domain.includes('game') || domain.includes('play')) {
      inferredTags.push('Games', 'Entertainment');
      primaryTag = 'Games';
    } else if (domain.includes('video') || domain.includes('tube') || domain.includes('movie')) {
      inferredTags.push('Video', 'Entertainment');
      primaryTag = 'Video';
    } else if (domain.includes('music') || domain.includes('fm')) {
      inferredTags.push('Music', 'Entertainment');
      primaryTag = 'Music';
    } else if (domain.includes('ai') || domain.includes('gpt') || domain.includes('bot')) {
      inferredTags.push('AI', 'Tools');
      primaryTag = 'AI';
    }

    // 如果都没有推断出来，给定默认的 Tools 标签
    if (inferredTags.length === 0) {
      inferredTags.push('Tools');
    }

    return {
      tags: inferredTags,
      primaryTag
    };
  }
}
