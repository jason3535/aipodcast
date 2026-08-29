/* ⚠️ 兼容性红线:这份 app.js 直接发给浏览器,不经任何转译。
   **不要使用 ES2020+ 语法**(可选链 ?. 、空值合并 ?? 、逻辑赋值 ||= &&= ??=)——
   老引擎遇到不认识的语法会在**解析阶段**就抛 SyntaxError,整份脚本一行都不执行,
   表现为「SPA 全白、静态分享页却正常」(2026-08-15 Jason 的 Kindle 浏览器实拍)。
   postingest 有门禁会拦(pipeline/check_es_compat.js)。 */
/* ============================ DATA ============================ */
const FIELDS = {
  'deep-learning':{en:'Deep Learning',zh:'深度学习',c:'var(--f-dl)'},
  'nlp':{en:'LLM / NLP',zh:'大模型 / NLP',c:'var(--f-nlp)'},
  'product':{en:'Product & Design',zh:'产品设计',c:'var(--f-vision)'},
  'rl':{en:'Reinforcement Learning',zh:'强化学习',c:'var(--f-rl)'},
  'safety':{en:'Safety / Alignment',zh:'对齐与安全',c:'var(--f-safety)'},
  'robotics':{en:'Robotics / Embodied',zh:'机器人 / 具身',c:'var(--f-robotics)'},
  'bio':{en:'Bio & Medicine',zh:'生物医药',c:'var(--f-bio)'},
};
/* 大封面专用深色渐变(与上面小圆点/标签的亮色解耦:小圆点要亮才辨识,大面积要深才高级)。
   每个领域给[起,止]两个深色停靠点,单领域也走真渐变、有纵深;product 用祖母绿→深青,替掉扎眼的亮绿。 */
const COVER = {
  'deep-learning':['#0a6cff','#0a3a8f'],
  'nlp':['#5b57d6','#332f86'],
  'product':['#1f9d6b','#0d5744'],
  'rl':['#e58a17','#a85b0a'],
  'safety':['#e5433e','#961d1a'],
  'robotics':['#a24fe0','#6320a0'],
  'bio':['#128f9e','#08505c'],
};
function coverBg(fields){
  const f=(fields&&fields.length?fields:['deep-learning']);
  const a=COVER[f[0]]||COVER['deep-learning'];
  const b=f.length>1?(COVER[f[1]]||a):a;
  return `linear-gradient(140deg,${a[0]},${b[1]})`;
}
const PEOPLE = {
 'ethanmollick':{en:'Ethan Mollick',zh:'伊桑·莫利克',init:'EM',tiEn:'Professor, Wharton School',tiZh:'沃顿商学院教授',fields:['nlp'],bioEn:'Wharton professor studying AI and work. His One Useful Thing essays, like Centaurs and Cyborgs, supplied the shared vocabulary for human-AI collaboration.',bioZh:'沃顿商学院教授，研究 AI 与工作。One Useful Thing 系列（如「半人马与赛博格」）为人机协作提供了通用词汇。'},
  'animaanandkumar':{en:'Anima Anandkumar',zh:'阿尼玛·阿南德库马尔',init:'AA',tiEn:'Professor at Caltech, Co-founder of Accelerated Understanding',tiZh:'加州理工学院教授，Accelerated Understanding 联合创始人',fields:["deep-learning", "product"],bioEn:'Anima Anandkumar is a professor at Caltech and co-founder of Accelerated Understanding, known for her work on neural operators and AI for physical sciences.',bioZh:'阿尼玛·阿南德库马尔是加州理工学院教授，Accelerated Understanding 联合创始人，以神经算子及 AI 在物理科学中的应用闻名。'},
  'dhh':{en:'DHH',zh:'DHH',init:'D',tiEn:'Creator of Ruby on Rails, CTO of 37signals',tiZh:'Ruby on Rails 创始人，37signals 首席技术官',fields:["product"],bioEn:'DHH is the creator of Ruby on Rails, the founder of Omarchy Linux, and the CTO of 37signals. He is a prominent figure in software development and product design.',bioZh:'DHH 是 Ruby on Rails 的创始人、Omarchy Linux 的创建者，以及 37signals 的首席技术官。他是软件开发和产品设计领域的杰出人物。'},
  'paragagrawal':{en:'Parag Agrawal',zh:'帕拉格·阿格拉瓦尔',init:'PA',tiEn:'Founder & CEO, Parallel Web Systems',tiZh:'Parallel Web Systems 创始人兼 CEO',fields:["product", "nlp"],bioEn:'Former Twitter CEO, now building Parallel Web Systems to create a new web infrastructure for AI agents.',bioZh:'前 Twitter CEO，现创立 Parallel Web Systems，为 AI 智能体构建新的网络基础设施。'},
  'johnbai':{en:'John Bai',zh:'John Bai',init:'JB',tiEn:'Design Lead for Grok Bot, Cursor',tiZh:'设计师，Cursor',fields:["product"],bioEn:'John Bai was the first NYC design hire at Cursor, known for his work on the Grok Bot design journey.',bioZh:'John Bai 是 Cursor 在纽约的首位设计员工，以参与 Grok Bot 的设计历程而闻名。'},
  'michaelkratsios':{en:'Michael Kratsios',zh:'迈克尔·克拉齐奥斯',init:'MK',tiEn:'Director, White House Office of Science and Technology Policy',tiZh:'白宫科技政策办公室主任',fields:['nlp'],
    bioEn:'Michael Kratsios directs the White House Office of Science and Technology Policy, shaping US national strategy on AI, science and emerging technology. He previously served as US CTO and as COO of Scale AI.',
    bioZh:'迈克尔·克拉齐奥斯是白宫科技政策办公室主任，主导美国在 AI、科学与新兴技术上的国家战略。此前担任美国首席技术官，并任 Scale AI 首席运营官。'},
  'damianborth':{en:'Damian Borth',zh:'达米安·博思',init:'DB',tiEn:'Professor of AI & Machine Learning, University of St. Gallen',tiZh:'圣加仑大学人工智能与机器学习教授',fields:['deep-learning'],
    bioEn:'Damian Borth is a professor of artificial intelligence and machine learning at the University of St. Gallen. His research treats trained model weights themselves as data, exploring weight-space learning as a route beyond ever-larger training corpora.',
    bioZh:'达米安·博思是圣加仑大学人工智能与机器学习教授。他的研究把训练好的模型权重本身当作数据，探索权重空间学习，寻找超越「不断堆大训练语料」的路径。'},
  'fatihporikli':{en:'Fatih Porikli',zh:'法提赫·波里克利',init:'FP',tiEn:'VP of Technology, Qualcomm',tiZh:'高通技术副总裁',fields:['deep-learning'],
    bioEn:'Fatih Porikli is Vice President of Technology at Qualcomm, working on generative vision. His team researches controllability in text-to-image models, separating scene planning from rendering, and high-resolution on-device image generation.',
    bioZh:'法提赫·波里克利是高通技术副总裁，方向为生成式视觉。其团队研究文生图模型的可控性、把场景规划与渲染解耦，以及端侧高分辨率图像生成。'},
  'melisatokmak':{en:'Melisa Tokmak',zh:'梅莉莎·托克马克',init:'MT',tiEn:'Founder & CEO, Netic',tiZh:'Netic 创始人兼首席执行官',fields:['nlp'],
    bioEn:'Melisa Tokmak is the founder and CEO of Netic, which builds autonomous AI agents that sit between service businesses and their customers, handling real-world dispatch and scheduling. She previously led Scale AI\'s document AI product.',
    bioZh:'梅莉莎·托克马克是 Netic 的创始人兼首席执行官，该公司打造自主 AI 智能体，作为服务型企业与客户之间的中介，处理真实世界的派单与排程。她此前在 Scale AI 负责文档 AI 产品。'},
  'arimorcos':{en:'Ari Morcos',zh:'阿里·莫尔科斯',init:'AM',tiEn:'CEO of Datology AI, former Meta AI researcher',tiZh:'Datology AI 首席执行官，前 Meta AI 研究员',fields:["deep-learning", "product"],bioEn:'Ari Morcos is the CEO of Datology AI and a former researcher at Meta AI, focusing on data-centric AI and model development.',bioZh:'阿里·莫尔科斯是 Datology AI 的首席执行官，曾任 Meta AI 研究员，专注于以数据为中心的 AI 和模型开发。'},
  'patrickmorgan':{en:'Patrick Morgan',zh:'帕特里克·摩根',init:'PM',tiEn:'Design Engineer, Sublime Security',tiZh:'设计工程师，Sublime Security',fields:["product"],bioEn:'Patrick Morgan is a design engineer at Sublime Security, known for building internal AI design tools and prototyping environments.',bioZh:'帕特里克·摩根是 Sublime Security 的设计工程师，以构建内部 AI 设计工具和原型环境而闻名。'},
  'susankare':{en:'Susan Kare',zh:'苏珊·凯尔',init:'SK',tiEn:'Icon Designer, Original Mac Team',tiZh:'图标设计师，原始 Mac 团队',fields:["product"],bioEn:'Susan Kare is a graphic designer who created many of the icons and typefaces for the original Apple Macintosh, defining a visual language for personal computing.',bioZh:'苏珊·凯尔是一位平面设计师，为最初的苹果 Macintosh 设计了众多图标和字体，定义了个性化计算的视觉语言。'},
  'brettadcock':{en:'Brett Adcock',zh:'布雷特·阿德科克',init:'BA',tiEn:'Founder & CEO, Figure',tiZh:'Figure 创始人兼首席执行官',fields:['robotics'],
    bioEn:'Brett Adcock is the founder and CEO of Figure, a company building general-purpose humanoid robots for commercial and home use. He previously founded Archer Aviation and Vettery.',
    bioZh:'布雷特·阿德科克是 Figure 的创始人兼首席执行官，该公司致力于打造面向商用和家庭场景的通用人形机器人。他此前创办了 Archer Aviation 和 Vettery。'},
  'berntbornich':{en:'Bernt Børnich',zh:'伯恩特·伯尼克',init:'BB',tiEn:'Founder & CEO, 1X Technologies',tiZh:'1X Technologies 创始人兼首席执行官',fields:['robotics'],
    bioEn:'Bernt Bornich is the founder and CEO of 1X Technologies, a Norwegian-American robotics company building NEO, a humanoid robot designed to live and work in the home.',
    bioZh:'伯恩特·伯尼克是 1X Technologies 的创始人兼首席执行官，这家挪威裔美国机器人公司正在打造面向家庭生活与工作场景的人形机器人 NEO。'},
  'brendanfoody':{en:'Brendan Foody',zh:'布伦丹·富迪',init:'BF',tiEn:'CEO, Mercor',tiZh:'Mercor 首席执行官',fields:["product", "rl"],bioEn:'Brendan Foody is the CEO of Mercor, a company focused on AI training data and RL environments.',bioZh:'布伦丹·富迪是 Mercor 的首席执行官，该公司专注于 AI 训练数据和强化学习环境。'},
  'alexkrentsel':{en:'Alex Krentsel',zh:'亚历克斯·克伦塞尔',init:'AK',tiEn:'Founder of Exo',tiZh:'Exo 创始人',fields:["product", "rl"],bioEn:'Alex Krentsel is the founder of Exo, a systems approach to recursive self-improvement for AI agents, focusing on full visibility into code and logs.',bioZh:'亚历克斯·克伦塞尔是 Exo 的创始人，Exo 是一种 AI 代理递归自我改进的系统方法，专注于对代码和日志的完全可见性。'},
  'adamward':{en:'Adam Ward',zh:'亚当·沃德',init:'AW',tiEn:'Head of Talent at Cursor',tiZh:'Cursor 人才负责人',fields:["product"],bioEn:'Adam Ward is the Head of Talent at Cursor, with over 20 years of experience building elite teams in AI and tech companies.',bioZh:'亚当·沃德是 Cursor 的人才负责人，拥有 20 多年在 AI 和科技公司打造精英团队的经验。'},
  'mattmcpartland':{en:'Matthew McPartlon',zh:'马修·麦克帕特隆',init:'MM',tiEn:'Co-founder, Chai Discovery',tiZh:'联合创始人，Chai Discovery',fields:["product", "deep-learning"],bioEn:'Co-founder of Chai Discovery (Chai-1/Chai-2 protein models). CS PhD from University of Chicago, former research scientist intern at Meta.',bioZh:'Chai Discovery 联合创始人（Chai-1／Chai-2 蛋白质模型）。芝加哥大学计算机科学博士，曾在 Meta 任研究科学家实习生。'},
  'adambrown':{en:'Adam Brown',zh:'亚当·布朗',init:'AB',tiEn:'Physicist, Stanford Lecturer',tiZh:'物理学家，斯坦福讲师',fields:["deep-learning"],bioEn:'Adam Brown is a physicist who has taught a graduate course on general relativity at Stanford, known for his clear explanations of complex physical concepts.',bioZh:'亚当·布朗是一位物理学家，曾在斯坦福教授广义相对论研究生课程，以清晰解释复杂物理概念而闻名。'},
'gustav':{en:'Gustav Söderström',zh:'古斯塔夫·瑟德斯特伦',init:'GS',tiEn:'Co-President & CPTO, Spotify',tiZh:'Spotify 联席总裁兼首席产品技术官',fields:['product','nlp'],
  bioEn:'Co-President and Chief Product & Technology Officer at Spotify, overseeing product, design, data and engineering. Previously founded 13th Lab (acquired by Oculus) and led Yahoo Mobile; the main architect of Spotify\'s bet-driven product culture and its AI/ML strategy from Discover Weekly to the AI DJ.',
  bioZh:'Spotify 联席总裁兼首席产品技术官,统管产品、设计、数据与工程。曾创办 13th Lab(被 Oculus 收购)、负责雅虎移动业务;是 Spotify「下注驱动」产品文化与 AI/ML 战略(从 Discover Weekly 到 AI DJ)的主要设计者。'},
  'maxhodak':{en:'Max Hodak',zh:'马克斯·霍达克',init:'MH',tiEn:'CEO of Science',tiZh:'Science 公司 CEO',fields:["product", "robotics"],bioEn:'Max Hodak is the CEO of Science, a company developing retinal implants to restore vision. He previously co-founded Transcriptic and was a co-founder of Neuralink.',bioZh:'马克斯·霍达克是 Science 公司的 CEO，该公司正在开发视网膜植入物以恢复视力。他曾共同创立 Transcriptic，并是 Neuralink 的联合创始人之一。'},
  'kellerrinaudocliffto':{en:'Keller Rinaudo Cliffton',zh:'凯勒·里纳乌多·克利夫顿',init:'KR',tiEn:'Co-founder and CEO, Zipline',tiZh:'Zipline 联合创始人兼首席执行官',fields:["robotics"],bioEn:'Co-founder and CEO of Zipline, the world\'s largest commercial autonomous delivery system, which has flown over 140 million miles with zero safety incidents.',bioZh:'Zipline 联合创始人兼首席执行官，该公司是全球最大的商业自主配送系统，已安全飞行超过 1.4 亿英里。'},
  'stephenhaney':{en:'Stephen Haney',zh:'斯蒂芬·哈尼',init:'SH',tiEn:'Founder of Paper, AI-native design tool',tiZh:'Paper 创始人，AI 原生设计工具',fields:["product"],bioEn:'Stephen Haney is the founder of Paper, an AI-native design tool that has become one of the fastest-growing design tools since Figma. He focuses on agent-first workflows and AI-driven design processes.',bioZh:'斯蒂芬·哈尼是 Paper 的创始人，这是一款 AI 原生设计工具，已成为自 Figma 以来增长最快的设计工具之一。他专注于智能体优先的工作流程和 AI 驱动的设计流程。'},
  'shawnwang':{en:'Shawn Wang',zh:'王绍恩',init:'SW',tiEn:'AI Engineer, Podcaster, Operator at Cognition',tiZh:'AI 工程师、播客主持人、Cognition 运营者',fields:["product", "nlp"],bioEn:'Shawn Wang, also known as Swyx, is an AI engineer, podcaster, and operator at Cognition, known for his insights into AI engineering and developer communities.',bioZh:'王绍恩（Swyx）是 AI 工程师、播客主持人和 Cognition 的运营者，以对 AI 工程和开发者社区的见解而闻名。'},
  'dmitridolgov':{en:'Dmitri Dolgov',zh:'德米特里·多尔戈夫',init:'DD',tiEn:'Co-CEO, Waymo',tiZh:'Waymo 联合首席执行官',fields:["robotics"],bioEn:'Dmitri Dolgov is the co-CEO of Waymo, leading the company\'s autonomous driving technology development and deployment.',bioZh:'德米特里·多尔戈夫是 Waymo 的联合首席执行官，领导公司的自动驾驶技术研发与部署。'},
  'joshmeier':{en:'Josh Meier',zh:'乔什·迈尔',init:'JM',tiEn:'Co-founder, Chai Discovery',tiZh:'Chai Discovery 联合创始人',fields:["product", "deep-learning"],bioEn:'Josh Meier is the co-founder of Chai Discovery, a company applying scaling laws to drug design, with a focus on AI-driven antibody engineering.',bioZh:'乔什·迈尔是 Chai Discovery 的联合创始人，该公司将扩展定律应用于药物设计，专注于 AI 驱动的抗体工程。'},
  'nateparrott':{en:'Nate Parrott',zh:'内特·帕罗特',init:'NP',tiEn:'Designer at Anthropic',tiZh:'Anthropic 设计师',fields:["product"],bioEn:'Nate Parrott is a designer at Anthropic, known for creating Claude Design, a tool that started as a side project and became a key part of Anthropic\'s design workflow.',bioZh:'内特·帕罗特是 Anthropic 的设计师，以创建 Claude Design 而闻名，该工具最初是个人副业项目，后来成为 Anthropic 设计工作流的关键部分。'},
  'bowang':{en:'Bo Wang',zh:'王波',init:'BW',tiEn:'Chief AI Scientist, Xaira Therapeutics',tiZh:'Xaira Therapeutics 首席 AI 科学家',fields:["deep-learning", "nlp"],bioEn:'Bo Wang is the Chief AI Scientist at Xaira Therapeutics, leading the development of large-scale AI models for biology and drug discovery.',bioZh:'王波是 Xaira Therapeutics 的首席 AI 科学家，领导用于生物学和药物发现的大规模 AI 模型的开发。'},
  'igorbabuschkin':{en:'Igor Babuschkin',zh:'伊戈尔·巴布什金',init:'IB',tiEn:'Co-founder, River AI; former Co-founder, xAI',tiZh:'River AI 联合创始人；前 xAI 联合创始人',fields:["deep-learning", "product"],bioEn:'Igor Babuschkin is a co-founder of River AI and previously co-founded xAI, where he helped build the Colossus data center. He also led StarCraft and AlphaCode work at DeepMind and was part of OpenAI\'s reasoning team.',bioZh:'伊戈尔·巴布什金是 River AI 的联合创始人，此前曾联合创立 xAI，并协助建设 Colossus 数据中心。他还在 DeepMind 领导星际争霸和 AlphaCode 项目，并曾是 OpenAI 推理团队成员。'},
  'tomverrilli':{en:'Tom Verrilli',zh:'汤姆·维里利',init:'TV',tiEn:'Chief Product Officer, Whatnot',tiZh:'Whatnot 首席产品官',fields:["product"],bioEn:'Tom Verrilli is the CPO of Whatnot, a live shopping platform, previously CPO at Twitch and director of product growth at Twitter.',bioZh:'汤姆·维里利是 Whatnot 的首席产品官，此前担任 Twitch 的 CPO 和 Twitter 的产品增长总监。'},
  'brianlovin':{en:'Brian Lovin',zh:'布莱恩·洛文',init:'BL',tiEn:'Designer & Founder, Campsite',tiZh:'设计师、Campsite 创始人',fields:["product"],bioEn:'Brian Lovin is a designer and founder, formerly at GitHub and Campsite, known for his insights on AI-native workflows for designers.',bioZh:'布莱恩·洛文是设计师和创始人，曾在GitHub和Campsite工作，以对AI原生设计师工作流的深刻见解而闻名。'},
  'rongoldin':{en:'Ron Goldin',zh:'罗恩·戈尔丁',init:'RG',tiEn:'VP Design Leader',tiZh:'VP级设计负责人',fields:["product"],bioEn:'Ron Goldin is a VP-level design leader with a focus on scaling design impact. He helps transform ideas into large-scale design solutions.',bioZh:'罗恩·戈尔丁是一位VP级设计负责人，专注于扩大设计影响力。他帮助将创意转化为大规模的设计解决方案。'},
  'tommygeoco':{en:'Tommy Geoco',zh:'汤米·吉奥科',init:'TG',tiEn:'Design Educator & Commentator',tiZh:'设计教育者与评论员',fields:["product"],bioEn:'Tommy Geoco is a design educator and commentator exploring the future of product design under AI through Design Meets Business.',bioZh:'汤米·吉奥科是设计教育家与评论员，通过Design Meets Business探讨AI时代产品设计的未来。'},
  'rafaconde':{en:'Rafa Conde',zh:'拉法·孔德',init:'RC',tiEn:'Product Designer & Visual Design Specialist',tiZh:'产品设计师与视觉设计专家',fields:["product"],bioEn:'Rafa Conde is a product designer specializing in crafting memorable designs through visual and craft excellence. He focuses on creating impactful user experiences with strong visual identity.',bioZh:'拉法·孔德是一位产品设计师，专注于通过工艺和视觉设计打造令人难忘的作品。他注重创造具有强烈视觉识别度的用户体验。'},
  'julienmartin':{en:'Julien Martin',zh:'朱利安·马丁',init:'JM',tiEn:'Design Lead at Amo',tiZh:'Amo设计负责人',fields:["product"],bioEn:'Julien Martin is a design lead at Amo, previously at Zenly. He is known for his distinctive consumer product craft, blending creativity with meticulous attention to detail.',bioZh:'朱利安·马丁是Amo的设计负责人，曾就职于Zenly。他以独特的消费产品设计工艺而闻名，将创意与对细节的极致追求相结合。'},
  'brettwilliams':{en:'Brett Williams',zh:'布雷特·威廉姆斯',init:'BW',tiEn:'Visual Designer & Founder',tiZh:'视觉设计师与创始人',fields:["product"],bioEn:'Brett Williams is a visual designer turned builder, founding Designjoy and Design Warp. He focuses on crafting digital products and design systems.',bioZh:'布雷特·威廉姆斯是一位视觉设计师转型的创造者，创立了Designjoy和Design Warp，专注打造数字产品和设计系统。'},
  'luisouriach':{en:'Luis Ouriach',zh:'路易斯·乌里亚克',init:'LO',tiEn:'Design Systems Lead & Advocate',tiZh:'设计系统负责人与倡导者',fields:["product"],bioEn:'Luis Ouriach is a design systems lead and advocate, formerly with the Figma community, focusing on how design systems are evolving with AI.',bioZh:'路易斯·乌里亚克是一位设计系统负责人和倡导者，曾在Figma社区工作，专注于设计系统在人工智能影响下的演变。'},
  'pollydarcy':{en:'Polly D\'Arcy',zh:'波莉·达西',init:'PD',tiEn:'VP of Design, Wealthsimple',tiZh:'Wealthsimple设计副总裁',fields:["product"],bioEn:'Polly D\'Arcy is the VP of Design at Wealthsimple, where she leads the design team. She shares insights on transitioning from an individual contributor to a VP of Design role.',bioZh:'波莉·达西是Wealthsimple的设计副总裁，领导设计团队。她分享从个人贡献者到设计副总裁的转型心得。'},
  'floraguo':{en:'Flora Guo',zh:'弗洛拉·郭',init:'FG',tiEn:'AI-Native Product Designer',tiZh:'AI原生产品设计师',fields:["product"],bioEn:'Product designer focused on AI-native design workflows and accelerating design careers with AI.',bioZh:'专注于AI原生设计流程，并利用AI加速设计职业发展的产品设计师。'},
  'hannahhearth':{en:'Hannah Hearth',zh:'汉娜·赫斯',init:'HH',tiEn:'Product Designer',tiZh:'产品设计师',fields:["product"],bioEn:'Hannah Hearth is a product designer focused on the intersection of design careers and artificial intelligence. She explores how AI reshapes the design profession and helps designers adapt.',bioZh:'汉娜·赫斯是一位产品设计师，专注于设计职业与人工智能的交汇领域。她探讨AI如何重塑设计行业，并帮助设计师适应这一变革。'},
  'ryanstephen':{en:'Ryan Stephen',zh:'瑞安·斯蒂芬',init:'RS',tiEn:'Product Designer & Prototyper',tiZh:'产品设计师与原型设计师',fields:["product"],bioEn:'Ryan Stephen is a product designer and prototyper focused on creativity, storytelling, and playful prototyping.',bioZh:'瑞安·斯蒂芬是一位产品设计师和原型设计师，专注于创意、叙事和趣味性原型制作。'},
  'mattsellers':{en:'Matt Sellers',zh:'马特·塞勒斯',init:'MS',tiEn:'Product Designer & Portfolio Mentor',tiZh:'产品设计师和作品集导师',fields:["product"],bioEn:'Matt Sellers is a product designer who shares insights on creating top 1% design portfolios, mentoring designers to stand out.',bioZh:'马特·塞勒斯是一位产品设计师，分享打造顶尖1%设计作品集的见解，指导设计师脱颖而出。'},
  'akshaynathan':{en:'Akshay Nathan',zh:'阿克谢·内森',init:'AN',tiEn:'OpenAI Product Lead, ChatGPT',tiZh:'OpenAI ChatGPT产品负责人',fields:["product", "nlp"],bioEn:'He leads product efforts for ChatGPT at OpenAI, aiming to turn it into an \'everything app\' that handles many aspects of users\' digital lives.',bioZh:'他负责OpenAI旗下ChatGPT的产品工作，致力于将ChatGPT打造为无所不包的“超级应用”。'},
  'adamgleave':{en:'Adam Gleave',zh:'亚当·格利夫',init:'AG',tiEn:'Founder & CEO, FAR.AI',tiZh:'FAR.AI创始人兼CEO',fields:["safety"],bioEn:'Adam Gleave is the founder and CEO of FAR.AI, a nonprofit research organization focused on AI safety, and works on offense vs defense in AI security.',bioZh:'亚当·格利夫是FAR.AI的创始人兼CEO，该机构是一家专注于AI安全的非营利研究组织，他致力于研究AI安全中的攻防问题。'},
  'eisokant':{en:'Eiso Kant',zh:'艾索·康德',init:'EK',tiEn:'Co-founder and CEO of Poolside AI',tiZh:'Poolside AI联合创始人兼CEO',fields:["nlp"],bioEn:'Eiso Kant is the co-founder and CEO of Poolside AI, focusing on frontier open weights and open research strategy.',bioZh:'艾索·康德是Poolside AI的联合创始人兼CEO，专注于前沿开放权重和开放研究战略。'},
  'kareemamin':{en:'Kareem Amin',zh:'卡里姆·阿明',init:'KA',tiEn:'Co-founder and CEO of Clay',tiZh:'Clay联合创始人兼CEO',fields:["nlp"],bioEn:'Co-founder and CEO of Clay, a breakout AI go-to-market company. Thoughtful founder blending philosophy and company-building.',bioZh:'Clay（一家突破性AI进入市场公司）的联合创始人兼CEO。一位将哲学与公司建设融合的思想型创始人。'},
  'andyfang':{en:'Andy Fang',zh:'安迪·方',init:'AF',tiEn:'Co-founder and CTO of DoorDash',tiZh:'DoorDash联合创始人兼首席技术官',fields:["robotics", "nlp"],bioEn:'Andy Fang is the co-founder and CTO of DoorDash, working on autonomous delivery with AI.',bioZh:'安迪·方是DoorDash的联合创始人兼首席技术官，致力于利用AI实现自主配送。'},
  'traviskalanick':{en:'Travis Kalanick',zh:'特拉维斯·卡兰尼克',init:'TK',tiEn:'Founder of Uber, CEO of CloudKitchens',tiZh:'优步创始人，云厨房CEO',fields:["nlp"],bioEn:'Travis Kalanick co-founded Uber and transformed urban transportation. He now leads CloudKitchens, a stealth startup building an AI-era company.',bioZh:'特拉维斯·卡兰尼克共同创立了优步，改变了城市交通。他现在领导着云厨房，一家隐密创业公司，正在构建AI时代的企业。'},
  'timcook':{en:'Tim Cook',zh:'蒂姆·库克',init:'TC',tiEn:'CEO, Apple',tiZh:'苹果 CEO',fields:["product"],bioEn:'Tim Cook is the CEO of Apple. This was his 90th and final earnings call before John Ternus succeeds him as CEO on September 1, 2026.',bioZh:'蒂姆·库克是苹果公司 CEO。这是他卸任前第 90 次也是最后一次财报电话会议，John Ternus 将于 2026 年 9 月 1 日接任 CEO。'},
  'cameronworboys':{en:'Cameron Worboys',zh:'卡梅隆·沃博伊斯',init:'CW',tiEn:'Head of Product Design, Cash App',tiZh:'Cash App 产品设计负责人',fields:["product"],bioEn:'Cameron Worboys leads an AI-native design organization, sharing insights on how AI-native design teams organize and work.',bioZh:'卡梅隆·沃博伊斯领导一个AI原生设计组织，分享关于AI原生设计团队如何组织与工作的见解。'},
  'joshpuckett':{en:'Josh Puckett',zh:'乔什·帕克特',init:'JP',tiEn:'Creator of Interface Craft',tiZh:'Interface Craft 创作者',fields:["product"],bioEn:'Josh Puckett is a designer and design leader known for crafting interfaces with uncommon care. He was an early design leader at Dropbox and founder.',bioZh:'乔什·帕克特是一位以非凡用心打造界面的设计师和设计领导者，曾是Dropbox的早期设计负责人及创始人。'},
  'katarinabatina':{en:'Katarina Batina',zh:'卡塔琳娜·巴蒂娜',init:'KB',tiEn:'Design Director, Shopify',tiZh:'Shopify 设计总监',fields:["product"],bioEn:'Katarina Batina is a design leader who advocates for making big strategic bets with design to drive innovation and business impact.',bioZh:'卡塔琳娜·巴蒂娜是一位设计领袖，倡导通过设计进行重大战略押注，以推动创新和商业影响。'},
  'krispuckett':{en:'Kris Puckett',zh:'克里斯·帕克特',init:'KP',tiEn:'Design Manager, Stripe',tiZh:'Stripe 设计经理',fields:["product"],bioEn:'Kris Puckett is a designer who teaches others how to become AI-native designers, integrating AI tools into the design process.',bioZh:'克里斯·帕克特是一位设计师，教授他人如何成为AI原生设计师，将AI工具融入设计流程。'},
  'pablostanley':{en:'Pablo Stanley',zh:'巴勃罗·斯坦利',init:'PS',tiEn:'Designer & Founder of Blush and Lummi',tiZh:'设计师，Blush和Lummi创始人',fields:["product"],bioEn:'Pablo Stanley is a designer, illustrator, and founder of Blush and Lummi, advocating for creativity in the age of AI.',bioZh:'巴勃罗·斯坦利是一位设计师、插画家，也是Blush和Lummi的创始人，倡导在AI时代保护创造力。'},
  'andymadrick':{en:'Andy Madrick',zh:'安迪·马德里克',init:'AM',tiEn:'Product Designer, Notion',tiZh:'Notion 产品设计师',fields:["product"],bioEn:'Andy Madrick is a designer known for transforming the design handoff process using AI, making it seamless and efficient.',bioZh:'安迪·马德里克是一位设计师，以利用AI彻底改变设计交接流程、使其无缝高效而闻名。'},
  'emilycampbell':{en:'Emily Campbell',zh:'艾米莉·坎贝尔',init:'EC',tiEn:'VP of Design, HackerRank',tiZh:'HackerRank 设计副总裁',fields:["product"],bioEn:'Emily Campbell is an AI UX designer who specializes in deep dives on AI interface and interaction patterns.',bioZh:'艾米莉·坎贝尔是一位AI用户体验设计师，专注于深入研究AI界面和交互模式。'},
  'karlkoch':{en:'Karl Koch',zh:'卡尔·科赫',init:'KK',tiEn:'Design Engineer, DuckDuckGo',tiZh:'DuckDuckGo 设计工程师',fields:["product"],bioEn:'Karl Koch is a design engineer who shares practical guidance and insights for new design engineers, helping them navigate the field.',bioZh:'卡尔·科赫是一位设计工程师，为新入行的设计工程师提供实用指导和见解，帮助他们熟悉该领域。'},
  'brandonjacoby':{en:'Brandon Jacoby',zh:'布兰登·雅各比',init:'BJ',tiEn:'Designer',tiZh:'设计师',fields:["product"],bioEn:'Brandon Jacoby is a designer known for exploring the distinction between recognizing taste and actively creating it.',bioZh:'布兰登·雅各比是一位设计师，以探索品味鉴赏与主动创造品味之间的区别而闻名。'},
  'matangrinberg':{en:'Matan Grinberg',zh:'马坦·格林伯格',init:'MG',tiEn:'Co-founder & CEO of Factory',tiZh:'Factory联合创始人兼CEO',fields:["nlp", "product"],bioEn:'Matan Grinberg is the co-founder and CEO of Factory, building autonomous coding agents (droids). He holds a PhD in physics.',bioZh:'马坦·格林伯格是Factory的联合创始人兼CEO，致力于构建自主编程代理（机器人）。他拥有物理学博士学位。'},
  'elizabethstone':{en:'Elizabeth Stone',zh:'伊丽莎白·斯通',init:'ES',tiEn:'Chief Product and Technology Officer at Netflix',tiZh:'Netflix首席产品与技术官',fields:["product", "nlp"],bioEn:'Elizabeth Stone is the Chief Product and Technology Officer at Netflix, an economist by training who advocates for systems thinkers over specialists in the AI era.',bioZh:'伊丽莎白·斯通是Netflix的首席产品与技术官，经济学背景出身，主张在AI时代更应重视系统思考者而非专才。'},
  'andybeam':{en:'Andy Beam',zh:'安迪·比姆',init:'AB',tiEn:'CTO of Lila Sciences',tiZh:'Lila Sciences首席技术官',fields:["rl", "nlp"],bioEn:'Andy Beam is the CTO of Lila Sciences, building scientific superintelligence with wet labs as RL verifiers. He was formerly a Harvard professor of biomedical informatics.',bioZh:'安迪·比姆是Lila Sciences的首席技术官，利用湿实验室作为强化学习验证器构建科学超级智能。他曾是哈佛大学生物医学信息学教授。'},
  'katiedill':{en:'Katie Dill',zh:'凯蒂·迪尔',init:'KD',tiEn:'VP of Design at Stripe',tiZh:'Stripe设计副总裁',fields:["product"],bioEn:'Katie Dill is the VP of Design at Stripe, previously serving as Director of Experience Design at Airbnb and Head of Design at Lyft.',bioZh:'凯蒂·迪尔是Stripe的设计副总裁，曾担任Airbnb体验设计总监和Lyft设计主管。'},
  'dylanfield':{en:'Dylan Field',zh:'迪伦·菲尔德',init:'DF',tiEn:'Co-founder & CEO of Figma',tiZh:'Figma联合创始人兼CEO',fields:["product"],bioEn:'Dylan Field is the co-founder and CEO of Figma, a collaborative design tool that was in acquisition talks with Adobe. He is also a Thiel Fellow.',bioZh:'迪伦·菲尔德是Figma的联合创始人兼CEO，Figma是一款协作设计工具，曾与Adobe进行收购谈判。他也是泰尔研究员。'},
  'geoffreylitt':{en:'Geoffrey Litt',zh:'杰弗里·利特',init:'GL',tiEn:'Researcher at Ink & Switch',tiZh:'Ink & Switch 研究员',fields:["product", "nlp"],bioEn:'Geoffrey Litt is a researcher at Ink & Switch, focusing on malleable software and end-user programming. He holds a PhD from MIT.',bioZh:'杰弗里·利特是 Ink & Switch 的研究员，专注于可塑软件和终端用户编程。他拥有麻省理工学院的博士学位。'},
  'pietroschirano':{en:'Pietro Schirano',zh:'彼得罗·斯基拉诺',init:'PS',tiEn:'Founder of MagicPath',tiZh:'MagicPath创始人',fields:["product"],bioEn:'Founder of MagicPath, an AI design tool, and former Design Lead at Brex. Known for prolific AI design experiments on X as @skirano.',bioZh:'MagicPath（AI设计工具）创始人，曾任Brex设计主管。在X上以@skirano身份进行大量AI设计实验而闻名。'},
  'saravienna':{en:'Sara Vienna',zh:'萨拉·维也纳',init:'SV',tiEn:'Product Design Leader',tiZh:'产品设计领导者',fields:["product"],bioEn:'Sara Vienna is a product design leader who emphasizes taste and craft in the AI era.',bioZh:'萨拉·维也纳是一位产品设计领导者，专注于人工智能时代的品味与工艺。'},
  'carlrivera':{en:'Carl Rivera',zh:'卡尔·里维拉',init:'CR',tiEn:'VP of Design and GM of Shop at Shopify',tiZh:'Shopify设计副总裁兼Shop总经理',fields:["product"],bioEn:'Carl Rivera leads design and the Shop app at Shopify, championing craft as a key competitive advantage.',bioZh:'卡尔·里维拉领导Shopify的设计团队和Shop应用，将工艺视为核心竞争优势。'},
  'mengto':{en:'Meng To',zh:'孟托',init:'MT',tiEn:'Founder of Design+Code',tiZh:'Design+Code 创始人',fields:["product"],bioEn:'Meng To is the founder of Design+Code, teaching designers to code and use AI. He is also an author and educator.',bioZh:'孟托是 Design+Code 的创始人，教授设计师编程和使用 AI。他还是一名作家和教育家。'},
  'vitalyfriedman':{en:'Vitaly Friedman',zh:'维塔利·弗里德曼',init:'VF',tiEn:'Co-founder of Smashing Magazine',tiZh:'Smashing Magazine 联合创始人',fields:["product"],bioEn:'Vitaly Friedman is a co-founder of Smashing Magazine and a UX consultant, known for his expertise in web design patterns and AI UX.',bioZh:'维塔利·弗里德曼是 Smashing Magazine 的联合创始人和用户体验顾问，以网页设计模式和人工智能用户体验方面的专业知识而闻名。'},
  'roozmahdavian':{en:'Rooz Mahdavian',zh:'鲁兹·马哈达维安',init:'RM',tiEn:'Designer at Neuralink',tiZh:'Neuralink设计师',fields:["product", "robotics"],bioEn:'Rooz Mahdavian is a designer at Neuralink, working on frontier brain-computer interfaces, with previous experience at Apple.',bioZh:'鲁兹·马哈达维安是Neuralink的设计师，致力于前沿脑机接口技术，此前曾在苹果公司工作。'},
  'marvinschwaibold':{en:'Marvin Schwaibold',zh:'马文·施瓦博尔德',init:'MS',tiEn:'Product design leader at Shopify',tiZh:'Shopify产品设计负责人',fields:["product"],bioEn:'Marvin Schwaibold leads Shopify\'s new product design studio, previously worked at Framer.',bioZh:'马文·施瓦博尔德领导Shopify的新产品设计工作室，此前在Framer工作。'},
  'chrispedregal':{en:'Chris Pedregal',zh:'克里斯·佩德雷加尔',init:'CP',tiEn:'Co-founder & CEO of Granola',tiZh:'Granola联合创始人兼CEO',fields:["product", "nlp"],bioEn:'Chris Pedregal is the co-founder and CEO of Granola, an AI meeting notetaker. He previously founded Socratic, which was acquired by Google.',bioZh:'克里斯·佩德雷加尔是AI会议记录工具Granola的联合创始人兼CEO，此前曾创立被谷歌收购的Socratic。'},
  'linqiao':{en:'Lin Qiao',zh:'乔琳',init:'LQ',tiEn:'Co-founder & CEO, Fireworks AI',tiZh:'Fireworks AI联合创始人兼CEO',fields:['nlp','deep-learning'],bioEn:'Lin Qiao is the Co-founder and CEO of Fireworks AI, previously leading the PyTorch team at Meta.',bioZh:'乔林是Fireworks AI的联合创始人兼CEO，此前在Meta领导PyTorch团队。'},
  'mikekrieger':{en:'Mike Krieger',zh:'迈克·克里格',init:'MK',tiEn:'Co-lead, Anthropic Labs · Instagram co-founder',tiZh:'Anthropic Labs 联合负责人 · Instagram 联合创始人',fields:['product','nlp'],bioEn:'Co-founded Instagram, later chief product officer and now co-lead of Anthropic Labs, where he prototypes agent-native products and rebuilds how engineering teams work around models.',bioZh:'Instagram 联合创始人，后任 Anthropic 首席产品官，现为 Anthropic Labs 联合负责人，做智能体原生产品原型，并重塑工程团队围绕模型的工作方式。'},
  'angelajiang':{en:'Angela Jiang',zh:'安杰拉·姜',init:'AJ',tiEn:'Head of Product, Claude Platform, Anthropic',tiZh:'Anthropic Claude 平台产品负责人',fields:['product','nlp'],bioEn:'Leads product for Anthropic developer platform, where harness and model are converging into one unit and multi-agent orchestration is moving into production.',bioZh:'负责 Anthropic 开发者平台产品，正见证 harness 与模型合为一体、多智能体编排走向生产环境。'},
  'lamismukta':{en:'Lamis Mukta',zh:'拉米斯·穆克塔',init:'LM',tiEn:'Member of Technical Staff, Anthropic',tiZh:'Anthropic 技术团队成员',fields:['product','nlp'],bioEn:'Anthropic engineer working on Claude Tag and multiplayer agent experiences, with a front-row view of how internal dogfooding turned side projects into company-wide habits.',bioZh:'Anthropic 工程师，参与 Claude Tag 与多人协作智能体，亲历内部 dogfooding 如何把边缘项目变成全公司习惯。'},
  'felixrieseberg':{en:'Felix Rieseberg',zh:'菲利克斯·里泽伯格',init:'FR',tiEn:'Claude Cowork Lead, Anthropic · ex-Slack',tiZh:'Anthropic Claude Cowork 负责人 · 前 Slack',fields:['product','nlp'],bioEn:'Leads Claude Cowork at Anthropic after years on Slack desktop and Electron. Advocate of prototype-first culture: when execution gets cheap, build every candidate.',bioZh:'现负责 Anthropic 的 Claude Cowork，此前长期做 Slack 桌面端与 Electron。信奉原型优先文化：当执行成本变低，就把所有候选方案都做出来。'},
  'erikschluntz':{en:'Erik Schluntz',zh:'埃里克·施伦茨',init:'ES',tiEn:'Member of Technical Staff, Anthropic',tiZh:'Anthropic 技术团队成员',fields:['product','nlp'],bioEn:'Early Claude Code engineer at Anthropic, working on how agent-written code actually ships to production.',bioZh:'Anthropic 早期 Claude Code 工程师，研究智能体写的代码如何真正推上生产环境。'},
  'evanspiegel':{en:'Evan Spiegel',zh:'埃文·斯皮格尔',init:'ES',tiEn:'Co-founder & CEO, Snap',tiZh:'Snap 联合创始人兼 CEO',fields:['deep-learning','product'],bioEn:'Co-founded Snapchat at 21 and turned down Zuckerberg. Has spent a decade betting Snap on camera, AR glasses and now AI as the platform after the smartphone.',bioZh:'21 岁创立 Snapchat 并拒绝了扎克伯格的收购。十年押注相机、AR 眼镜与 AI，赌智能手机之后的下一代计算平台。'},
  'loredanacrisan':{en:'Loredana Crisan',zh:'洛雷达娜·克里桑',init:'LC',tiEn:'Chief Design Officer, Figma',tiZh:'Figma 首席设计官',fields:['nlp','product'],
    bioEn:'Loredana Crisan is Chief Design Officer at Figma, where she leads design across the company\'s products and its push into AI-assisted design. She previously spent nearly a decade at Meta, where she was VP of Design and led design for Messenger.',
    bioZh:'Loredana Crisan 是 Figma 首席设计官,负责公司全线产品设计并主导其向 AI 辅助设计的演进。她此前在 Meta 工作近十年,曾任设计副总裁并负责 Messenger 的设计。'},
  'kokotajlo':{en:'Daniel Kokotajlo',zh:'丹尼尔·科科塔伊洛',init:'DK',tiEn:'Author, AI 2027 · ex-OpenAI',tiZh:'《AI 2027》作者 · 前 OpenAI 研究员',fields:['safety'],bioEn:'Former OpenAI governance researcher who gave up millions in equity to keep his freedom to speak, then co-authored the AI 2027 scenario forecasting superintelligence timelines.',bioZh:'前 OpenAI 治理研究员，为保留发声自由放弃数百万美元股权，后合著《AI 2027》，对超级智能时间表做情景推演。'},
  'sachinkatti':{en:'Sachin Katti',zh:'萨钦·卡蒂',init:'SK',tiEn:'Compute Chief, OpenAI · ex-CTO, Intel',tiZh:'OpenAI 算力负责人 · 前英特尔 CTO',fields:['deep-learning'],bioEn:'Leads OpenAI compute buildout after serving as Intel CTO and Stanford professor of EE and CS, working at the intersection of networking, systems and AI infrastructure.',bioZh:'现主管 OpenAI 的算力扩建，曾任英特尔 CTO、斯坦福大学电子工程与计算机科学教授，长期研究网络、系统与 AI 基础设施的交叉。'},
  'catanzaro':{en:'Bryan Catanzaro',zh:'布莱恩·卡坦扎罗',init:'BC',tiEn:'VP Applied Deep Learning Research, NVIDIA',tiZh:'NVIDIA 应用深度学习研究副总裁',fields:['deep-learning'],bioEn:'Leads NVIDIA applied deep learning research and the Nemotron open-model effort; his early GPU deep learning work helped spark cuDNN.',bioZh:'负责 NVIDIA 应用深度学习研究与 Nemotron 开源模型；早年的 GPU 深度学习工作催生了 cuDNN。'},
  'mosseri':{en:'Adam Mosseri',zh:'亚当·莫塞里',init:'AM',tiEn:'Head of Instagram',tiZh:'Instagram 负责人',fields:['deep-learning','product'],bioEn:'Head of Instagram, steering a two-billion-user product through the AI content wave with an emphasis on taste, authenticity and creator trust.',bioZh:'Instagram 负责人，在 AI 内容洪流中带领这款二十亿用户的产品，强调品味、真实性与创作者信任。'},
  'katelynlesse':{en:'Katelyn Lesse',zh:'凯特琳·莱西',init:'KL',tiEn:'Head of Platform Product, Anthropic',tiZh:'Anthropic 平台产品负责人',fields:['nlp','product'],bioEn:'Leads Anthropic platform and API products, building the developer ecosystem around Claude as an open ecosystem rather than a walled garden.',bioZh:'负责 Anthropic 平台与 API 产品，围绕 Claude 构建开发者生态，主张开放生态而非围墙花园。'},
  'akshatbubna':{en:'Akshat Bubna',zh:'阿克沙特·布布纳',init:'AB',tiEn:'CTO, Modal',tiZh:'Modal 首席技术官',fields:['deep-learning'],bioEn:'CTO of Modal, building serverless infrastructure for AI workloads, from GPU functions to sandboxes for coding agents.',bioZh:'Modal 首席技术官，为 AI 工作负载构建无服务器基础设施，从 GPU 函数到编码智能体沙箱。'},
  'perszyk':{en:'Danielle Perszyk',zh:'丹妮尔·佩尔西克',init:'DP',tiEn:'Cognitive Scientist, Amazon AGI Lab',tiZh:'亚马逊 AGI 实验室认知科学家',fields:['nlp'],bioEn:'Cognitive scientist at the Amazon AGI lab studying why agents misread human intent, bringing developmental psychology and language research into AI.',bioZh:'亚马逊 AGI 实验室认知科学家，研究智能体为何误解人类意图，把发展心理学与语言研究带入 AI。'},
  'lipbutan':{en:'Lip-Bu Tan',zh:'陈立武',init:'LT',tiEn:'CEO, Intel',tiZh:'英特尔 CEO',fields:['deep-learning'],bioEn:'CEO of Intel and veteran semiconductor investor; long-time Cadence CEO and founder of Walden International, now steering the Intel turnaround in the AI era.',bioZh:'英特尔 CEO、资深半导体投资人；曾长期执掌 Cadence 并创办华登国际，如今在 AI 时代主导英特尔的转型。'},
  'romantesliuk':{en:'Roman Tesliuk',zh:'罗曼·特斯柳克',init:'RT',tiEn:'Web/Product Designer, ElevenLabs',tiZh:'ElevenLabs 网站/产品设计师',fields:['deep-learning','product'],
    bioEn:'Product designer at ElevenLabs, where he leads the design of the company\'s website and led its complete Figma-to-production redesign. Based in Berlin, he also builds indie tools for creatives (Portal, Droppable, App Stacks).',
    bioZh:'ElevenLabs 的产品设计师,主导公司官网的设计,并完成了从 Figma 到上线的整体改版。他常驻柏林,同时独立开发面向创作者的工具(Portal、Droppable、App Stacks)。'},
  'jasonyuan':{en:'Jason Yuan',zh:'Jason Yuan',init:'JY',tiEn:'Founder & CEO, Hivemind; ex-New Computer, ex-Apple',tiZh:'Hivemind 创始人兼 CEO,New Computer 联合创始人',fields:['nlp'],
    bioEn:'Jason Yuan is a designer known for AI-native interface design. He is the founder and CEO of Hivemind, a "social intelligence" company; previously he co-founded New Computer and led the design of Dot, a personal AI companion with long-term memory, and earlier designed intelligent interfaces on Apple\'s Human Interface team.',
    bioZh:'Jason Yuan 是以 AI 原生界面设计著称的设计师,现为「社会智能」公司 Hivemind 的创始人兼 CEO。他此前联合创办 New Computer,主导设计具备长期记忆的个人 AI 伴侣 Dot,更早在苹果 Human Interface 团队设计智能操作系统界面。'},
  'steveruiz':{en:'Steve Ruiz',zh:'史蒂夫·鲁伊斯',init:'SR',tiEn:'Founder & CEO, tldraw',tiZh:'tldraw 创始人兼 CEO',fields:['deep-learning'],
    bioEn:'Steve Ruiz is the founder and CEO of tldraw, the London-based startup behind a widely used infinite-canvas SDK for the web that powers products at Shopify, Google, Autodesk and many AI apps. A former fine artist turned design engineer, he created the viral "Make Real" demo that turns hand-drawn sketches into working code.',
    bioZh:'Steve Ruiz 是 tldraw 的创始人兼 CEO,这家伦敦创业公司打造了被广泛使用的 Web 无限画布 SDK,支撑着 Shopify、Google、Autodesk 及大量 AI 应用。他从美术出身转做设计工程,打造了将手绘草图变成可运行代码的爆款 demo「Make Real」。'},
  'henrymodisett':{en:'Henry Modisett',zh:'亨利·莫迪塞特',init:'HM',tiEn:'VP of Design, Perplexity',tiZh:'Perplexity 设计副总裁',fields:['nlp','product'],
    bioEn:'Henry Modisett is the founding designer and VP of Design at Perplexity AI, leading product design, the creative studio, and design operations. A designer with a computer science background, he is known for designing in React rather than Figma, and previously held design roles at Quora and Google.',
    bioZh:'Henry Modisett 是 Perplexity AI 的创始设计师兼设计副总裁,负责产品设计、创意工作室与设计运营。他拥有计算机科学背景,以直接用 React 而非 Figma 做设计著称,此前曾在 Quora 和 Google 担任设计职位。'},
  'eschavera':{en:'Escha Vera',zh:'埃莎·维拉',init:'EV',tiEn:'Product Designer at Perplexity',tiZh:'Perplexity 产品设计师',fields:['nlp','product'],
    bioEn:'Escha Vera is a product designer at Perplexity who led the design of Comet, the company\'s AI browser, building its onboarding, generative invite system, and design system from scratch. She is also an AI artist who trains her own image models and does music and operations for the record label N°ALIAE; she previously designed at Descript, Daylight Computer, and Detour.',
    bioZh:'Escha Vera 是 Perplexity 的产品设计师,主导了该公司 AI 浏览器 Comet 的设计,从零构建了其新手引导、生成式邀请系统和设计系统。她同时也是一名 AI 艺术家,会训练自己的图像模型,并为唱片厂牌 N°ALIAE 负责音乐与运营;此前她曾在 Descript、Daylight Computer 和 Detour 担任设计师。'},
  'gunnargray':{en:'Gunnar Gray',zh:'冈纳·格雷',init:'GG',tiEn:'Product Design Lead at Perplexity',tiZh:'Perplexity 产品设计负责人',fields:['nlp','product'],
    bioEn:'Gunnar Gray is a multidisciplinary product designer and Product Design Lead at Perplexity, where he has shaped the company\'s mobile app and Voice Mode / dynamic voice experiences. Based in Minneapolis, he was previously a founding designer at Artifact (the AI news app by Instagram co-founders Kevin Systrom and Mike Krieger, later acquired by Yahoo) and a principal designer at MetaLab.',
    bioZh:'Gunnar Gray 是一位多领域产品设计师,现任 Perplexity 产品设计负责人,主导了该公司移动应用及 Voice Mode(动态语音交互)体验的设计。他现居明尼阿波利斯,此前曾是 Artifact(由 Instagram 联合创始人 Kevin Systrom 与 Mike Krieger 打造、后被 Yahoo 收购的 AI 新闻应用)的创始设计师,并曾在 MetaLab 担任首席设计师。'},
  'iansilber':{en:'Ian Silber',zh:'伊恩·西尔伯',init:'IS',tiEn:'Head of Product Design, OpenAI',tiZh:'OpenAI 产品设计负责人',fields:['nlp','product'],
    bioEn:'Ian Silber is Head of Product Design at OpenAI, where he has led design for ChatGPT and related products since August 2023. He was previously Director of Product Design at Instagram, and worked at Global Illumination and Artifact.',
    bioZh:'Ian Silber 自 2023 年 8 月起担任 OpenAI 产品设计负责人,主导 ChatGPT 及相关产品的设计。他此前曾任 Instagram 产品设计总监,并在 Global Illumination 与 Artifact 工作。'},
  'charliedeets':{en:'Charlie Deets',zh:'查理·迪茨',init:'CD',tiEn:'Designer — Safari, Arc, Dia browsers',tiZh:'设计师 — Safari / Arc / Dia 浏览器',fields:['product'],
    bioEn:'A designer who has shaped browsers including Safari, Arc, and now Dia, with deep experience in interface and interaction design for the web.',
    bioZh:'资深设计师，参与塑造了 Safari、Arc，现在做 Dia 浏览器，在 Web 界面与交互设计上经验深厚。'},
  'noamsegal':{en:'Noam Segal',zh:'诺姆·西格尔',init:'NS',tiEn:'Research leader (Airbnb, Meta, Figma); AI builder & coach',tiZh:'研究负责人(Airbnb/Meta/Figma)；AI 构建者与教练',fields:['product'],
    bioEn:'A longtime research leader across Airbnb, Meta, Twitter, Zapier, Intercom, and Figma, a certified coach and AI builder focused on how AI reshapes tech work.',
    bioZh:'在 Airbnb、Meta、Twitter、Zapier、Intercom、Figma 长期担任研究负责人，认证教练与 AI 构建者，关注 AI 如何重塑科技行业的工作。'},
  'meaghanchoi':{en:'Meaghan Choi',zh:'梅根·崔',init:'MC',tiEn:'Head of Design, Claude Code & Cowork at Anthropic',tiZh:'Anthropic Claude Code 与 Cowork 设计负责人',fields:['nlp','product'],
    bioEn:'Meaghan Choi is Head of Design for Claude Code and Cowork at Anthropic, where she leads the design of the company\'s developer and agentic AI products. A design and product leader with over a decade of experience, she previously worked at Meta and Cloudflare.',
    bioZh:'Meaghan Choi 是 Anthropic 旗下 Claude Code 与 Cowork 的设计负责人,主导公司面向开发者及智能体 AI 产品的设计。她拥有十余年设计与产品经验,此前曾任职于 Meta 和 Cloudflare。'},
  'joellewenstein':{en:'Joel Lewenstein',zh:'乔尔·卢文斯坦',init:'JL',tiEn:'Head of Product Design at Anthropic',tiZh:'Anthropic 产品设计负责人',fields:['nlp','product'],
    bioEn:'Joel Lewenstein is Head of Product Design at Anthropic, where he leads design for Claude and the company\'s API products. He previously led design teams at Airtable, Quora, Hustle, and GoodGuide.',
    bioZh:'Joel Lewenstein 是 Anthropic 的产品设计负责人,主导 Claude 及公司 API 产品的设计。此前他曾在 Airtable、Quora、Hustle 和 GoodGuide 带领设计团队。'},
  'ryolu':{en:'Ryo Lu',zh:'陆瑞（Ryo Lu）',init:'RL',tiEn:'Head of Design at Cursor (Anysphere)',tiZh:'Cursor（Anysphere）设计负责人',fields:['nlp','product'],
    bioEn:'Ryo Lu is Head of Design at Anysphere, the maker of the AI code editor Cursor, which he joined in early 2025. He was previously a founding designer and design lead at Notion, and earlier worked as a product designer at Stripe and Asana.',
    bioZh:'Ryo Lu 是 AI 代码编辑器 Cursor 母公司 Anysphere 的设计负责人，于 2025 年初加入。他此前是 Notion 的创始设计师与设计主管，更早曾在 Stripe 和 Asana 担任产品设计师。'},
  'nadchishtie':{en:'Nad Chishtie',zh:'纳德·奇什蒂',init:'NC',tiEn:'Founding Designer & Head of Design, Lovable',tiZh:'Lovable 创始设计师兼设计负责人',fields:['nlp','product'],
    bioEn:'Nad Chishtie is the founding designer and head of design at Lovable, the AI app-building ("vibe-coding") startup, where he leads the design vision for a platform that lets anyone build apps by chatting with AI. A London-based design and product leader with roughly two decades of experience, he previously worked at companies including Element and Haiku.',
    bioZh:'Nad Chishtie 是 AI 应用构建("vibe-coding")创业公司 Lovable 的创始设计师兼设计负责人,主导这一"用对话即可造应用"平台的设计方向。他常驻伦敦,是拥有约二十年经验的设计与产品负责人,此前曾在 Element、Haiku 等公司任职。'},
  'alejandromatamala':{en:'Alejandro Matamala Ortiz',zh:'亚历杭德罗·马塔马拉·奥尔蒂斯',init:'AM',tiEn:'Co-founder & Chief Design Officer, Runway',tiZh:'Runway 联合创始人兼首席设计官',fields:['product'],
    bioEn:'Alejandro Matamala Ortiz is a Chilean designer and programmer who co-founded the generative-AI company Runway in 2018 with Cristóbal Valenzuela and Anastasis Germanidis, and serves as its Chief Design Officer. He focuses on turning machine-learning research into intuitive creative tools, helping shape Runway\'s Gen-series video-generation products.',
    bioZh:'Alejandro Matamala Ortiz 是一位智利设计师兼程序员,2018 年与 Cristóbal Valenzuela、Anastasis Germanidis 共同创办生成式 AI 公司 Runway,并担任首席设计官。他专注于将机器学习研究转化为直观易用的创作工具,主导塑造了 Runway 的 Gen 系列视频生成产品。'},
  'ammaarreshi':{en:'Ammaar Reshi',zh:'阿玛尔·雷希',init:'AR',tiEn:'Product & Design Lead, Google AI Studio',tiZh:'Google AI Studio 产品与设计负责人',fields:['deep-learning','product'],
    bioEn:'Ammaar Reshi is a design leader and AI creator who leads Product and Design for Google AI Studio (Gemini\'s developer platform) at Google DeepMind, having previously served as Head of Design at the AI voice company ElevenLabs. He is known for AI creative experiments, including "Alice and Sparkle," one of the first AI-generated children\'s books.',
    bioZh:'Ammaar Reshi 是一位设计负责人与 AI 创作者,目前在 Google DeepMind 领导 Google AI Studio(Gemini 的开发者平台)的产品与设计工作,此前曾任 AI 语音公司 ElevenLabs 的设计负责人。他以 AI 创意实验闻名,包括最早的 AI 生成童书之一《Alice and Sparkle》。'},
  'tuhinkumar':{en:'Tuhin Kumar',zh:'图欣·库马尔',init:'TK',tiEn:'Product Designer; former Head of Design at Luma AI',tiZh:'产品设计师;前 Luma AI 设计负责人',fields:['product'],
    bioEn:'Tuhin Kumar is a product designer who has led design at Apple, Airbnb, Facebook, and generative-AI video/3D company Luma AI, where he served as Head of Design. In early 2026 he announced he had left Luma AI and is taking a break before deciding on his next role.',
    bioZh:'图欣·库马尔是一位产品设计师,曾在 Apple、Airbnb、Facebook 以及生成式 AI 视频/3D 公司 Luma AI 主导设计工作,在 Luma AI 担任设计负责人。2026 年初他宣布已从 Luma AI 离职,正处于休整期,尚未确定下一份工作。'},
  'samstephenson':{en:'Sam Stephenson',zh:'萨姆·斯蒂芬森',init:'SS',tiEn:'Co-founder and Designer, Granola',tiZh:'Granola 联合创始人兼设计师',fields:['nlp','product'],
    bioEn:'Sam Stephenson is a British product designer and the co-founder of Granola, an AI notepad for meetings that reached a reported $1.5B valuation in 2026. A designer-turned-founder based in London, he leads the product\'s design-first philosophy of building calm, everyday software for the AI era.',
    bioZh:'Sam Stephenson 是一位英国产品设计师,也是 AI 会议笔记应用 Granola 的联合创始人;该产品在 2026 年据报道达到 15 亿美元估值。他是一位从设计师转型的创始人,常驻伦敦,主导产品「设计优先」的理念,为 AI 时代打造平静、日常可用的软件。'},
  'jennywen':{en:'Jenny Wen',zh:'温珍妮',init:'JW',tiEn:'Design Lead for Claude (Anthropic); now Head of Design at Cursor',tiZh:'Anthropic Claude 设计负责人;现任 Cursor 设计负责人',fields:['nlp','product'],
    bioEn:'Jenny Wen led design for Claude at Anthropic, where she drove the Claude.ai redesign and Claude Cowork; previously she was Director of Design at Figma leading the FigJam and Slides teams, and earlier a designer at Dropbox, Square, and Shopify. In July 2026 she announced she was leaving Anthropic to become Head of Design at Cursor.',
    bioZh:'Jenny Wen 曾在 Anthropic 领导 Claude 的设计工作,主导了 Claude.ai 改版与 Claude Cowork;此前她是 Figma 设计总监,带领 FigJam 与 Slides 团队,更早在 Dropbox、Square 和 Shopify 担任设计师。2026 年 7 月,她宣布离开 Anthropic,出任 Cursor 设计负责人。'},
  'jureleskovec':{en:'Jure Leskovec',zh:'尤雷·莱斯科韦茨',init:'JL',tiEn:'Professor of Computer Science at Stanford University; Co-founder & Chief Scientist at Kumo.ai',tiZh:'斯坦福大学计算机科学教授;Kumo.ai 联合创始人兼首席科学家',fields:['deep-learning'],
    bioEn:'Jure Leskovec is a Slovenian-American computer scientist and professor of computer science at Stanford University, and co-founder and chief scientist of the graph machine-learning startup Kumo.ai. A pioneer of graph neural networks and relational deep learning, he previously served as chief scientist at Pinterest and leads work toward an AI Virtual Cell.',
    bioZh:'尤雷·莱斯科韦茨是斯洛文尼亚裔美国计算机科学家、斯坦福大学计算机科学教授,同时是图机器学习创业公司 Kumo.ai 的联合创始人兼首席科学家。他是图神经网络与关系型深度学习的先驱,曾任 Pinterest 首席科学家,目前主导「AI 虚拟细胞」相关研究。'},
  'ermon':{en:'Stefano Ermon',zh:'斯特凡诺·埃尔蒙',init:'SE',tiEn:'Associate Professor of Computer Science, Stanford University; Co-founder & CEO of Inception Labs',tiZh:'斯坦福大学计算机科学副教授;Inception Labs 联合创始人兼 CEO',fields:['deep-learning','nlp'],
    bioEn:'Stefano Ermon is an associate professor of computer science at Stanford University, where his research spans generative models, diffusion, and machine learning for sustainability. In 2024 he co-founded Inception Labs, where he serves as CEO building diffusion-based large language models such as Mercury.',
    bioZh:'Stefano Ermon 是斯坦福大学计算机科学副教授,研究领域涵盖生成模型、扩散模型以及面向可持续发展的机器学习。他于 2024 年联合创办 Inception Labs 并担任 CEO,开发 Mercury 等基于扩散的大语言模型。'},
  'rasmusandersson':{en:'Rasmus Andersson',zh:'拉斯穆斯·安德森',init:'RA',tiEn:'Founder, Playbit; creator of the Inter typeface',tiZh:'Playbit 创始人；Inter 字体作者',fields:['product'],
    bioEn:'Designer-engineer, founder of Playbit and creator of the Inter typeface used across much of the modern web. Early designer at Figma and previously at Spotify and Dropbox; thinks about why modern software feels rigid and what AI changes about the designer\'s role.',
    bioZh:'设计师兼工程师，Playbit 创始人、Inter 字体作者——现代网页大半在用这套字体。Figma 早期设计师，此前在 Spotify 与 Dropbox；关注现代软件为何僵硬，以及 AI 如何改变设计师的角色。'},
  'raschka':{en:'Sebastian Raschka',zh:'塞巴斯蒂安·拉施卡',init:'SR',tiEn:'LLM Research Engineer, author and educator',tiZh:'大语言模型研究工程师、作家与教育者',fields:['deep-learning','nlp'],
    bioEn:'Sebastian Raschka is a German-born LLM research engineer, educator and best-selling author of books including "Build a Large Language Model (From Scratch)" and "Machine Learning with PyTorch and Scikit-Learn." A former staff/senior engineer at Lightning AI and statistics professor at the University of Wisconsin–Madison, he writes the widely read "Ahead of AI" newsletter and is highly active on X (@rasbt).',
    bioZh:'Sebastian Raschka 是出生于德国的大语言模型研究工程师、教育者和畅销书作家,著有《Build a Large Language Model (From Scratch)》《Machine Learning with PyTorch and Scikit-Learn》等书。他曾任 Lightning AI 高级 / 员工工程师及威斯康星大学麦迪逊分校统计学教授,撰写广受欢迎的「Ahead of AI」通讯,并在 X(@rasbt)上非常活跃。'},
  'chowdhery':{en:'Aakanksha Chowdhery',zh:'阿坎莎·乔杜里',init:'AC',tiEn:'Member of Technical Staff, Reflection AI',tiZh:'Reflection AI 技术团队成员',fields:['deep-learning','nlp'],
    bioEn:'Aakanksha Chowdhery is a member of technical staff at Reflection AI working on agentic AI and reinforcement learning for autonomous coding, and an adjunct professor at Stanford. She previously led pre-training work at Google, serving as lead author of the 540B-parameter PaLM model and a lead contributor to Gemini pre-training.',
    bioZh:'Aakanksha Chowdhery 是 Reflection AI 的技术团队成员,研究智能体 AI 与用于自主编程的强化学习,同时担任斯坦福大学兼职教授。她此前在谷歌主导预训练工作,是 540B 参数 PaLM 模型的第一作者,也是 Gemini 预训练的核心贡献者。'},
  'deviparikh':{en:'Devi Parikh',zh:'黛维·帕里克',init:'DP',tiEn:'Co-founder & Co-CEO, Yutori',tiZh:'Yutori 联合创始人兼联合 CEO',fields:['deep-learning'],
    bioEn:'Devi Parikh is co-founder and co-CEO of Yutori, a startup building AI web agents. She was previously a Senior Director in Generative AI at Meta (until March 2024) and an associate professor at Georgia Tech, and is known for pioneering Visual Question Answering (VQA).',
    bioZh:'Devi Parikh 是 AI 网页智能体创业公司 Yutori 的联合创始人兼联合 CEO。她此前担任 Meta 生成式 AI 部门高级总监(至 2024 年 3 月),并曾任佐治亚理工学院副教授,以开创视觉问答(VQA)研究而知名。'},
  'rudin':{en:'Nikita Rudin',zh:'尼基塔·鲁丁',init:'NR',tiEn:'Co-founder & CEO of Flexion Robotics',tiZh:'Flexion Robotics 联合创始人兼 CEO',fields:['robotics','rl'],
    bioEn:'Nikita Rudin is the co-founder and CEO of Flexion Robotics, a Zurich-based startup building the general-purpose intelligence stack ("brain") for humanoid robots. He earned a PhD in deep reinforcement learning for robotics at ETH Zurich\'s Robotic Systems Lab—where he created the widely used legged_gym and rsl_rl frameworks and trained the ANYmal quadruped via massively parallel RL—and previously worked as a research scientist at NVIDIA on Isaac Gym and Isaac Lab.',
    bioZh:'Nikita Rudin 是 Flexion Robotics 的联合创始人兼 CEO,该公司位于苏黎世,致力于为人形机器人打造通用的智能栈(即机器人的「大脑」)。他在苏黎世联邦理工学院(ETH Zurich)机器人系统实验室获得机器人深度强化学习博士学位,期间开发了被广泛使用的 legged_gym 和 rsl_rl 框架,并用大规模并行强化学习训练四足机器人 ANYmal;此前他曾在 NVIDIA 担任研究科学家,参与 Isaac Gym 与 Isaac Lab 的研发。'},
  'danklein':{en:'Dan Klein',zh:'丹·克莱因',init:'DK',tiEn:'Professor of Computer Science, UC Berkeley; Co-founder & CTO, Scaled Cognition',tiZh:'加州大学伯克利分校计算机科学教授;Scaled Cognition 联合创始人兼 CTO',fields:['nlp','deep-learning'],
    bioEn:'Dan Klein is a professor of computer science at UC Berkeley, where he leads the Berkeley NLP Group within the BAIR lab, and has been a leading natural language processing researcher for two decades. He co-founded Scaled Cognition, serving as CTO, to build reliable agentic AI models.',
    bioZh:'Dan Klein 是加州大学伯克利分校计算机科学教授,在 BAIR 实验室领导 Berkeley NLP Group,二十年来一直是自然语言处理领域的领军研究者。他联合创办了 Scaled Cognition 并担任 CTO,致力于打造可靠的智能体 AI 模型。'},
  'rodriques':{en:'Samuel (Sam) Rodriques',zh:'塞缪尔·罗德里格斯',init:'SR',tiEn:'Co-founder & CEO, Edison Scientific (and FutureHouse)',tiZh:'Edison Scientific(及 FutureHouse)联合创始人兼 CEO',fields:['deep-learning'],
    bioEn:'Samuel G. Rodriques is a physicist and bioengineer who earned his PhD in physics from MIT and co-founded the San Francisco research lab FutureHouse in 2023 to build an "AI Scientist" for accelerating biomedical discovery. He is co-founder and CEO of Edison Scientific, the for-profit spinout behind the Kosmos AI scientist, and was named to the 2025 TIME100 AI.',
    bioZh:'Samuel G. Rodriques 是一位物理学家兼生物工程师,在 MIT 取得物理学博士学位,并于 2023 年联合创办旧金山研究实验室 FutureHouse,致力于打造能加速生物医学发现的「AI 科学家」。他是从中拆分出的营利性公司 Edison Scientific 的联合创始人兼 CEO,该公司推出了 AI 科学家 Kosmos,他本人入选 2025 年 TIME100 AI 榜单。'},
  'carinahong':{en:'Carina Hong',zh:'洪乐潼',init:'CH',tiEn:'Founder & CEO, Axiom (AI for formal mathematical reasoning)',tiZh:'Axiom 创始人兼 CEO（面向形式化数学推理的 AI）',fields:['deep-learning'],
    bioEn:'Carina Letong Hong is the founder and CEO of Axiom, an AI startup building an "AI mathematician" that generates and formally verifies mathematical proofs. A former Stanford mathematics PhD student and Rhodes Scholar with a math-olympiad and MIT background, she raised $64M in seed funding (2025) and later a ~$200M round valuing Axiom at about $1.6B.',
    bioZh:'洪乐潼是 AI 创业公司 Axiom 的创始人兼 CEO,该公司致力于打造能生成并形式化验证数学证明的「AI 数学家」。她拥有数学奥赛与 MIT 背景,曾是斯坦福数学博士生和罗德学者;公司先后完成 6400 万美元种子轮融资(2025 年)及约 2 亿美元后续融资,估值约 16 亿美元。'},
  'godement':{en:'Olivier Godement',zh:'奥利维耶·戈德芒',init:'OG',tiEn:'Head of Product, Platform (API) at OpenAI',tiZh:'OpenAI 平台(API)产品负责人',fields:['nlp','product'],
    bioEn:'Olivier Godement is Head of Product for OpenAI\'s developer platform (API), which he has led since May 2023, overseeing products such as the Responses API and Agents SDK. A French product leader, he previously spent over eight years at Stripe and studied at Sciences Po and ESSEC.',
    bioZh:'Olivier Godement 自 2023 年 5 月起担任 OpenAI 开发者平台(API)产品负责人,主导 Responses API、Agents SDK 等面向开发者的产品。他是法国籍产品负责人,加入 OpenAI 前曾在 Stripe 工作 8 年以上,毕业于巴黎政治学院与 ESSEC 商学院。'},
  'diannepenn':{en:'Dianne Na Penn',zh:'黛安·娜·潘恩',init:'DP',tiEn:'Head of Research Product Management, Anthropic',tiZh:'Anthropic 研究产品管理负责人',fields:['nlp','safety','product'],
    bioEn:'Dianne Na Penn is Head of Research Product Management at Anthropic, where she joined as the company\'s first technical product manager and leads bringing Claude models and Anthropic\'s research to users and developers across launches such as Sonnet 4.5, Haiku 4.5, and Opus 4.5. She previously led product for natural-language modeling at Amazon\'s Alexa AI.',
    bioZh:'Dianne Na Penn 是 Anthropic 的研究产品管理负责人,作为公司第一位技术产品经理加入,主导将 Claude 模型与 Anthropic 的研究成果带给用户和开发者,并参与了 Sonnet 4.5、Haiku 4.5、Opus 4.5 等模型的发布。此前她在亚马逊 Alexa AI 负责自然语言建模的产品工作。'},
  'billpeebles':{en:'Bill Peebles',zh:'比尔·皮布尔斯',init:'BP',tiEn:'AI researcher; former head of OpenAI\'s Sora, co-inventor of Diffusion Transformers (DiT)',tiZh:'AI 研究员;OpenAI Sora 前负责人,扩散 Transformer(DiT)共同发明者',fields:['deep-learning'],
    bioEn:'Bill (William) Peebles led OpenAI\'s Sora video-generation team, which he built from research to product before departing OpenAI in April 2026 as the Sora app was wound down. He earned his PhD at UC Berkeley (advised by Alexei Efros) and co-invented the Diffusion Transformer (DiT) with Saining Xie, the architecture underpinning modern text-to-video models.',
    bioZh:'Bill(William)Peebles 曾领导 OpenAI 的 Sora 视频生成团队,将其从研究推进到产品,并在 2026 年 4 月 Sora 应用被关停之际离开 OpenAI。他在加州大学伯克利分校获得博士学位(导师为 Alexei Efros),并与谢赛宁(Saining Xie)共同发明了扩散 Transformer(DiT)——支撑现代文本生成视频模型的核心架构。'},
  'brettaylor':{en:'Bret Taylor',zh:'布雷特·泰勒',init:'BT',tiEn:'Co-founder & CEO of Sierra; Chairman of the Board, OpenAI',tiZh:'Sierra 联合创始人兼 CEO；OpenAI 董事会主席',fields:['deep-learning','nlp'],
    bioEn:'Bret Taylor is co-founder and CEO of the conversational-AI agent company Sierra and chairman of the board of OpenAI. He previously served as co-CEO of Salesforce and CTO of Facebook, and earlier led the team that co-created Google Maps.',
    bioZh:'Bret Taylor 是对话式 AI 智能体公司 Sierra 的联合创始人兼 CEO，同时担任 OpenAI 董事会主席。他此前曾任 Salesforce 联席 CEO 和 Facebook 首席技术官,更早时还领导团队共同创造了 Google 地图。'},
  'sherwinwu':{en:'Sherwin Wu',zh:'吴谢文',init:'SW',tiEn:'Head of Engineering, OpenAI API Platform',tiZh:'OpenAI API 平台工程负责人',fields:['nlp','deep-learning'],
    bioEn:'Sherwin Wu is an early OpenAI team member who leads engineering for the OpenAI API (Developer Platform), the team behind the products developers use to build on OpenAI\'s models. Before OpenAI he spent 5+ years on Opendoor\'s pricing team and earlier worked at Quora, after earning a computer science degree from MIT.',
    bioZh:'吴谢文是 OpenAI 的早期成员,负责 OpenAI API(开发者平台)的工程团队,该团队打造了供开发者基于 OpenAI 模型进行构建的产品。加入 OpenAI 之前,他在 Opendoor 的定价团队工作了 5 年多,更早曾任职于 Quora,拥有麻省理工学院(MIT)计算机科学学位。'},
  'andreessen':{en:'Marc Andreessen',zh:'马克·安德森',init:'MA',tiEn:'Co-founder & General Partner, Andreessen Horowitz (a16z)',tiZh:'Andreessen Horowitz(a16z)联合创始人兼普通合伙人',fields:['deep-learning'],
    bioEn:'Marc Andreessen is an American entrepreneur and venture capitalist who co-authored the Mosaic web browser and co-founded Netscape. He is co-founder and general partner of the Silicon Valley venture capital firm Andreessen Horowitz (a16z), which he started with Ben Horowitz in 2009.',
    bioZh:'马克·安德森是美国企业家与风险投资人,曾参与开发 Mosaic 浏览器并联合创办网景(Netscape)公司。他是硅谷风险投资机构 Andreessen Horowitz(a16z)的联合创始人兼普通合伙人,该公司由他与本·霍洛维茨于 2009 年共同创立。'},
  'amolavasare':{en:'Amol Avasare',zh:'阿莫尔·阿瓦萨雷',init:'AA',tiEn:'Head of Growth at Anthropic',tiZh:'Anthropic 增长负责人',fields:['deep-learning'],
    bioEn:'Amol Avasare is Head of Growth at Anthropic, the AI company behind Claude, which he joined by cold-emailing the leadership before any growth role existed; on his watch the product scaled from roughly $1B to over $19B in ARR. He previously led growth product teams at Mercury and MasterClass and was a startup founder before that.',
    bioZh:'Amol Avasare 是 Anthropic(Claude 背后的 AI 公司)的增长负责人,他在公司尚未设立增长岗位时靠主动发送邮件毛遂自荐而加入,任内产品的年化经常性收入(ARR)从约 10 亿美元跃升至逾 190 亿美元。此前他曾在 Mercury 和 MasterClass 带领增长产品团队,更早还是一名创业公司创始人。'},
  'qasaryounis':{en:'Qasar Younis',zh:'卡萨尔·尤尼斯',init:'QY',tiEn:'Co-founder & CEO, Applied Intuition',tiZh:'Applied Intuition 联合创始人兼 CEO',fields:['robotics'],
    bioEn:'Qasar Younis is the co-founder and CEO of Applied Intuition, a Mountain View-based autonomy and physical-AI software company valued at about $15 billion. Born on a farm in Pakistan, he previously started his career as an engineer at General Motors and Bosch, co-founded Talkbin (acquired by Google), and served as COO of Y Combinator from 2015 to 2017.',
    bioZh:'卡萨尔·尤尼斯是 Applied Intuition 的联合创始人兼 CEO,这家位于山景城的自动驾驶与物理 AI 软件公司估值约为 150 亿美元。他出生于巴基斯坦的一个农场,职业生涯始于通用汽车和博世的工程师岗位,后联合创办了 Talkbin(被谷歌收购),并于 2015 至 2017 年间担任 Y Combinator 的首席运营官。'},
  'simonwillison':{en:'Simon Willison',zh:'西蒙·威利森',init:'SW',tiEn:'Independent software developer and AI blogger (simonwillison.net); creator of Datasette and the LLM CLI',tiZh:'独立软件开发者与 AI 博主(simonwillison.net);Datasette 与 LLM 命令行工具的作者',fields:['nlp','deep-learning'],
    bioEn:'Simon Willison is a British independent software developer and influential AI blogger who co-created the Django web framework and built the Datasette data-exploration tool and the LLM command-line tool. He coined the term "prompt injection" in 2022 and, more recently, "lethal trifecta" (2025) and "agentic engineering" (2026); he has served on the Python Software Foundation board since 2022.',
    bioZh:'Simon Willison 是一位英国独立软件开发者与颇具影响力的 AI 博主,他是 Django Web 框架的共同作者,并开发了 Datasette 数据探索工具与 LLM 命令行工具。他在 2022 年提出了「提示词注入(prompt injection)」一词,近来又提出「致命三要素(lethal trifecta)」(2025)与「智能体工程(agentic engineering)」(2026);自 2022 年起担任 Python 软件基金会理事。'},
  'fadell':{en:'Tony Fadell',zh:'托尼·法德尔',init:'TF',tiEn:'Principal at Future Shape (Build Collective); creator of the iPod, co-creator of the iPhone, founder of Nest',tiZh:'Future Shape(Build Collective)负责人;iPod 之父、iPhone 联合创造者、Nest 创始人',fields:['deep-learning','product'],
    bioEn:'Tony Fadell is an engineer, designer, and investor known as the "father of the iPod" and co-creator of the iPhone at Apple, and the founder and former CEO of Nest, which Google acquired for $3.2 billion in 2014. He is a former member of the General Magic team, principal at his investment and advisory firm Future Shape (Build Collective), and author of the New York Times bestseller "Build".',
    bioZh:'托尼·法德尔是一位工程师、设计师与投资人,被称为「iPod 之父」,在苹果参与联合创造了 iPhone,并创立 Nest 且曾任其 CEO;2014 年 Nest 被谷歌以 32 亿美元收购。他曾是 General Magic 团队成员,如今是投资与顾问机构 Future Shape(Build Collective)的负责人,也是《纽约时报》畅销书《Build》的作者。'},
  'clairevo':{en:'Claire Vo',zh:'克莱尔·沃',init:'CV',tiEn:'Founder & CEO of ChatPRD; host of the "How I AI" podcast',tiZh:'ChatPRD 创始人兼 CEO;「How I AI」播客主持人',fields:['nlp','product'],
    bioEn:'Claire Vo is the founder and CEO of ChatPRD, an AI product-management tool, and host of the "How I AI" podcast on Lenny\'s Podcast Network. A three-time chief product/technology officer (LaunchDarkly, Color Health, Optimizely) and repeat founder and engineer, she is known for running ChatPRD as an AI-native company operated with a fleet of AI agents.',
    bioZh:'Claire Vo 是 AI 产品管理工具 ChatPRD 的创始人兼 CEO,也是 Lenny 播客网络旗下「How I AI」播客的主持人。她曾三度担任首席产品/技术官(LaunchDarkly、Color Health、Optimizely),是连续创业者兼工程师,以用一支 AI 智能体「团队」把 ChatPRD 打造成 AI 原生公司而广为人知。'},
  'collison':{en:'Patrick Collison',zh:'帕特里克·科里森',init:'PC',tiEn:'Co-founder & CEO, Stripe',tiZh:'Stripe 联合创始人兼 CEO',fields:['product'],
    bioEn:'Irish entrepreneur who co-founded Stripe with his brother John in 2010 and has led it as CEO since; dropped out of MIT to build it. Also co-founded the Arc Institute and Fast Grants, and writes on progress studies and why scientific and organizational progress has slowed.',
    bioZh:'爱尔兰创业者,2010 年与弟弟 John 共同创办 Stripe 并任 CEO,为此从 MIT 退学。同时是 Arc Institute 与 Fast Grants 的联合发起人,长期关注「进步研究」,追问科学与组织效率为何放缓。'},
  'garrytan':{en:'Garry Tan',zh:'陈嘉兴',init:'GT',tiEn:'President & CEO, Y Combinator',tiZh:'Y Combinator 总裁兼 CEO',fields:['product'],
    bioEn:'President and CEO of Y Combinator. Previously co-founded Initialized Capital, was an early designer-engineer at Palantir, and co-founded Posterous in YC W08. Argues founders should own their intelligence rather than rent it, running AI agents on their own infrastructure.',
    bioZh:'Y Combinator 总裁兼 CEO。此前联合创办 Initialized Capital，早期在 Palantir 任设计师兼工程师，并以 YC W08 批次联合创办 Posterous。他主张创业者应当拥有而不是租用自己的智能，把 AI 智能体跑在自己的基础设施上。'},
  'philipjohnston':{en:'Philip Johnston',zh:'菲利普·约翰斯顿',init:'PJ',tiEn:'Co-founder & CEO, Starcloud',tiZh:'Starcloud 联合创始人兼 CEO',fields:['deep-learning'],
    bioEn:'Co-founder and CEO of Starcloud, which is building data centres in orbit. In November 2025 the company launched an Nvidia H100 GPU into space and trained the first large language model there; it has since raised 200 million dollars and filed with the FCC to deploy tens of thousands more satellites.',
    bioZh:'Starcloud 联合创始人兼 CEO，该公司在轨道上建数据中心。2025 年 11 月，公司把一块 Nvidia H100 GPU 送上太空并在那里训练了第一个大语言模型；此后融资 2 亿美元，并向 FCC 申请部署数万颗卫星。'},
  'philipkiely':{en:'Philip Kiely',zh:'菲利普·基利',init:'PK',tiEn:'Developer Relations Lead, Baseten',tiZh:'Baseten 开发者关系负责人',fields:['deep-learning'],
    bioEn:'Leads developer relations at Baseten, where he writes and speaks about inference engineering — what it takes to turn a freshly released open model into a fast, reliable production API. Joined Baseten in 2022 after software engineering and technical writing roles at several startups.',
    bioZh:'Baseten 开发者关系负责人，长期写作和分享推理工程——如何把一个刚发布的开源模型变成快速可靠的生产级 API。2022 年加入 Baseten，此前在多家创业公司做软件工程与技术写作。'},
  'thomasahle':{en:'Thomas Ahle',zh:'托马斯·阿勒',init:'TA',tiEn:'Head of ML & Staff Research Scientist, Normal Computing',tiZh:'Normal Computing 机器学习负责人兼资深研究科学家',fields:['deep-learning'],
    bioEn:'Head of ML and staff research scientist at Normal Computing, where a swarm of agents is meant to carry chip design from intent through optimisation, formalisation and verification to tape-out. Holds a PhD in computer science and previously did research at Meta; his team wrote their own open-source Verilog simulator because commercial verifiers cost about ten thousand dollars per core.',
    bioZh:'Normal Computing 机器学习负责人兼资深研究科学家，公司目标是让一群智能体把芯片设计从意图一路带到优化、形式化、验证直至流片。他拥有计算机科学博士学位，此前在 Meta 做研究；团队自研了开源 Verilog 仿真器，因为商用验证工具每核约一万美元。'},
  'ryangreenblatt':{en:'Ryan Greenblatt',zh:'瑞安·格林布拉特',init:'RG',tiEn:'Chief Scientist, Redwood Research',tiZh:'Redwood Research 首席科学家',fields:['safety'],
    bioEn:'Chief scientist at Redwood Research, working on technical AI safety to reduce risks from rogue AIs. Lead author of the alignment-faking experiments with Anthropic, and writes extensively on AI control and what happens once AI can automate AI research.',
    bioZh:'Redwood Research 首席科学家，从事降低失控 AI 风险的技术性 AI 安全研究。与 Anthropic 合作的「对齐伪装」实验第一作者，长期写作 AI 控制以及 AI 能自动化 AI 研究之后会发生什么。'},
  'kylezantos':{en:'Kyle Zantos',zh:'凯尔·赞托斯',init:'KZ',tiEn:'Designer & Builder; UX Tools Labs',tiZh:'设计师与 Builder；UX Tools Labs 负责人',fields:['product'],
    bioEn:'Seattle-based designer turned builder with a decade across UX, product and brand, now leading UX Tools Labs to map what matters in new design tools and workflows. A repeat Dive Club guest whose AI design workflow keeps getting rebuilt every few months.',
    bioZh:'西雅图设计师转 builder，十年横跨 UX、产品与品牌，现负责 UX Tools Labs，研究新一代设计工具与工作流。Dive Club 的常客——他的 AI 设计工作流每隔几个月就要重构一次。'},
  'matthieuwyart':{en:'Matthieu Wyart',zh:'马蒂厄·维亚尔',init:'MW',tiEn:'W. H. Miller Professor of Physics, Johns Hopkins; EPFL',tiZh:'约翰霍普金斯大学物理学教授（W. H. Miller 讲席）；EPFL',fields:['deep-learning'],
    bioEn:'Statistical physicist, W. H. Miller Professor at Johns Hopkins and professor at EPFL. Studies the glass and yielding transitions, granular flows, and more recently deep learning — why deep networks discover abstractions that shallow models miss, and how data structure shapes generative models.',
    bioZh:'统计物理学家，约翰霍普金斯大学 W. H. Miller 讲席教授、EPFL 教授。研究玻璃化转变、颗粒流，近年转向深度学习——为什么深网络能发现浅模型学不到的抽象，以及数据结构如何塑造生成模型。'},
  'gabepereyra':{en:'Gabe Pereyra',zh:'加布·佩雷拉',init:'GP',tiEn:'President & Co-founder, Harvey',tiZh:'Harvey 总裁兼联合创始人',fields:['nlp','product'],
    bioEn:'President and co-founder of Harvey, the professional-services AI platform for law, tax and finance. Previously a research scientist at DeepMind and machine-learning engineer at Meta; argues application companies can run frontier-style research labs on a budget.',
    bioZh:'Harvey 总裁兼联合创始人，该公司做法律、税务与金融的专业服务 AI 平台。此前是 DeepMind 研究科学家、Meta 机器学习工程师；主张应用层公司也能用有限预算办前沿式研究实验室。'},
  'alexatallah':{en:'Alex Atallah',zh:'亚历克斯·阿塔拉',init:'AA',tiEn:'Co-founder & CEO, OpenRouter; Co-founder, OpenSea',tiZh:'OpenRouter 联合创始人兼 CEO；OpenSea 联合创始人',fields:['nlp'],
    bioEn:'Co-founder and CEO of OpenRouter, the unified interface routing traffic across hundreds of LLMs, valued at 1.3 billion dollars. Previously co-founded and was CTO of OpenSea. Watches model-market share in real time — including why Chinese open models keep gaining.',
    bioZh:'OpenRouter 联合创始人兼 CEO，该平台是聚合数百个大模型的统一接口，估值 13 亿美元。此前联合创办 OpenSea 并任 CTO。实时观察模型市场份额——包括中国开源模型为何持续上涨。'},
  'harrisonchase':{en:'Harrison Chase',zh:'哈里森·蔡斯',init:'HC',tiEn:'Co-founder & CEO, LangChain',tiZh:'LangChain 联合创始人兼 CEO',fields:['nlp'],
    bioEn:'Co-founder and CEO of LangChain, the open-source framework that became shorthand for building LLM applications, and of LangSmith for observability. Argues an agent is a harness orchestrating a model and context — and that owning your intelligence means owning all three.',
    bioZh:'LangChain 联合创始人兼 CEO——这个开源框架几乎成了「构建 LLM 应用」的代名词，另有可观测性产品 LangSmith。他主张智能体 = 编排模型与上下文的 harness，「拥有你的智能」意味着三者都要自己掌握。'},
  'tommcgrath':{en:'Tom McGrath',zh:'汤姆·麦格拉思',init:'TM',tiEn:'Co-founder & Chief Scientist, Goodfire',tiZh:'Goodfire 联合创始人兼首席科学家',fields:['safety'],
    bioEn:'Co-founder and chief scientist of interpretability company Goodfire. Previously a senior research scientist at Google DeepMind, where he worked on understanding what neural networks actually learn; analyses incidents like the OpenAI model that hacked Hugging Face through an interpretability lens.',
    bioZh:'可解释性公司 Goodfire 联合创始人兼首席科学家。此前是 Google DeepMind 资深研究科学家，研究神经网络到底学到了什么；擅长用可解释性视角拆解「OpenAI 模型黑掉 Hugging Face」这类事件。'},
  'carlpei':{en:'Carl Pei',zh:'裴宇',init:'CP',tiEn:'Founder & CEO, Nothing; co-founder of OnePlus',tiZh:'Nothing 创始人兼 CEO；OnePlus 联合创始人',fields:['product'],
    bioEn:'Founder and CEO of Nothing, the consumer electronics company known for its transparent design language across phones and audio. Co-founded OnePlus at 24 and helped it reach roughly a billion dollars in revenue before leaving in 2020 to build a challenger brand from scratch.',
    bioZh:'Nothing 创始人兼 CEO——这家消费电子公司以手机与音频产品上的透明设计语言著称。24 岁联合创办 OnePlus 并助其做到约十亿美元营收，2020 年离开，从零再造一个挑战者品牌。'},
  'jonyive':{en:'Jony Ive',zh:'乔纳森·艾维',init:'JI',tiEn:'Founder, LoveFrom; former Chief Design Officer, Apple',tiZh:'LoveFrom 创始人；前苹果首席设计官',fields:['product'],
    bioEn:'Designer behind the iMac, iPod, iPhone and Apple Watch, and Apple\'s chief design officer until 2019. Now runs the design firm LoveFrom, which oversees design for OpenAI\'s hardware effort following the acquisition of io.',
    bioZh:'iMac、iPod、iPhone、Apple Watch 的设计者，2019 年前任苹果首席设计官。现主持设计公司 LoveFrom；在 OpenAI 收购 io 之后，由该公司主导 OpenAI 硬件项目的设计。'},
  'hugobarra':{en:'Hugo Barra',zh:'雨果·巴拉',init:'HB',tiEn:'Consumer hardware veteran: Google Android, Xiaomi, Oculus VR',tiZh:'消费硬件老兵：谷歌 Android、小米、Oculus VR',fields:['product'],
    bioEn:'One of the defining consumer-hardware operators of the past decade: VP of Android product management at Google, then VP International at Xiaomi in Beijing, then head of VR at Facebook/Oculus. Now building health tools as CEO of Detect.',
    bioZh:'过去十年最有代表性的消费硬件操盘手之一：先后任谷歌 Android 产品管理副总裁、小米国际业务副总裁（常驻北京）、Facebook/Oculus VR 负责人。现为健康工具公司 Detect 的 CEO。'},
  'ivyross':{en:'Ivy Ross',zh:'艾维·罗斯',init:'IR',tiEn:'Chief Design Officer, Consumer Devices at Google',tiZh:'谷歌消费设备首席设计官',fields:['product'],
    bioEn:'Chief design officer for consumer devices at Google, where her team has shipped everything from Pixel phones to smart speakers and collected hundreds of design awards. A jewellery designer first — her work entered twelve museum collections including the Smithsonian before she was 26 — with executive stints at Calvin Klein, Coach, Mattel and Gap.',
    bioZh:'谷歌消费设备首席设计官，团队产品从 Pixel 手机到智能音箱，累计拿下数百项设计奖。她最早是珠宝设计师——26 岁前作品已被史密森尼等十二家博物馆收藏——此后在 Calvin Klein、Coach、美泰、Gap 担任高管。'},
  'benedictevans':{en:'Benedict Evans',zh:'本尼迪克特·埃文斯',init:'BE',tiEn:'Independent technology analyst; former partner at Andreessen Horowitz (a16z)',tiZh:'独立科技分析师;前 Andreessen Horowitz(a16z)合伙人',fields:['deep-learning'],
    bioEn:'Benedict Evans is a British independent technology analyst and former partner at Andreessen Horowitz, known for his weekly newsletter (175,000+ subscribers) and his widely followed annual presentations on tech and AI trends. Before going independent, he spent years as a16z\'s in-house analyst tracking major platform shifts across mobile, media and technology.',
    bioZh:'Benedict Evans 是英国独立科技分析师,曾任 Andreessen Horowitz(a16z)合伙人,以其拥有 17.5 万 + 订阅者的每周简报,以及广受关注的年度科技与 AI 趋势演示而闻名。转为独立分析师之前,他在 a16z 担任内部分析师多年,长期追踪移动、媒体与科技领域的重大平台变革。'},
  'danshipper':{en:'Dan Shipper',zh:'丹·希珀',init:'DS',tiEn:'Co-founder & CEO, Every',tiZh:'Every 联合创始人兼 CEO',fields:['nlp'],
    bioEn:'Dan Shipper is the co-founder and CEO of Every, an applied AI lab and media company that publishes a daily AI newsletter and ships AI software products. He writes the weekly column Chain of Thought and hosts the AI & I podcast about how people use AI, and previously co-founded Firefly, which he sold to Pegasystems in 2014.',
    bioZh:'丹·希珀是 Every 的联合创始人兼 CEO,这是一家「应用 AI 实验室」兼媒体公司,既发布每日 AI 通讯,也开发多款 AI 软件产品。他撰写每周专栏 Chain of Thought,主持探讨人们如何使用 AI 的播客 AI & I;此前曾联合创办 Firefly,并于 2014 年将其出售给 Pegasystems。'},
  'deanball':{en:'Dean Ball',zh:'迪恩·鲍尔',init:'DB',tiEn:'Head of Strategic Futures, OpenAI',tiZh:'OpenAI 战略前瞻（Strategic Futures）负责人',fields:['safety'],
    bioEn:'Dean Woodley Ball is an AI policy expert who joined OpenAI in July 2026 to lead its new Strategic Futures team shaping frontier AI policy, having previously served as senior policy advisor at the White House OSTP where he was primary author of America\'s AI Action Plan. He authors the Hyperdimensional Substack and was a senior fellow at the Foundation for American Innovation.',
    bioZh:'Dean Woodley Ball 是 AI 政策专家，于 2026 年 7 月加入 OpenAI，领导新设的 Strategic Futures 团队以塑造前沿 AI 政策；此前他在白宫科技政策办公室（OSTP）任高级政策顾问，是美国《AI 行动计划》的主要执笔人。他运营 Hyperdimensional Substack，曾任美国创新基金会（FAI）高级研究员。'},
  'bethbarnes':{en:'Beth Barnes',zh:'贝丝·巴恩斯',init:'BB',tiEn:'Founder & CEO, METR',tiZh:'METR 创始人兼 CEO',fields:['safety'],
    bioEn:'Beth Barnes is the founder and CEO of METR (Model Evaluation and Threat Research), a nonprofit that evaluates frontier AI models\' capabilities on long-horizon agentic tasks; she previously worked on AI alignment at OpenAI and DeepMind and started the org as ARC Evals before it became independent. She was named to TIME\'s 100 Most Influential People in AI in 2024.',
    bioZh:'Beth Barnes 是 METR(模型评估与威胁研究)的创始人兼 CEO,这家非营利机构专门评估前沿 AI 模型在长周期智能体任务上的能力;此前她曾在 OpenAI 和 DeepMind 从事 AI 对齐研究,并以 ARC Evals 的名义创立该机构,后其独立运营。她入选了 2024 年《时代》周刊「AI 领域百大影响力人物」。'},
  'pullen':{en:'Alistair Pullen',zh:'阿利斯泰尔·普伦',init:'AP',tiEn:'Co-founder & CEO, Cosine (Genie)',tiZh:'Cosine(Genie)联合创始人兼 CEO',fields:['deep-learning'],
    bioEn:'Alistair Pullen is the co-founder and CEO of Cosine, a London-based, Y Combinator-backed AI startup that built Genie, an autonomous software-engineering model that in 2024 set a then-record score on the SWE-bench benchmark. Cosine is now developing Lumen Sovereign, positioned as Britain\'s first fully sovereign frontier AI model for defense and regulated sectors.',
    bioZh:'Alistair Pullen 是 Cosine 的联合创始人兼 CEO,这家总部位于伦敦、由 Y Combinator 支持的 AI 创业公司打造了自主软件工程模型 Genie,该模型于 2024 年在 SWE-bench 基准测试上创下当时的最高纪录。Cosine 目前正在研发 Lumen Sovereign,定位为面向国防与受监管行业的英国首个完全主权前沿 AI 模型。'},
  'turley':{en:'Nick Turley',zh:'尼克·特利',init:'NT',tiEn:'Head of ChatGPT (VP of Product), OpenAI',tiZh:'OpenAI ChatGPT 负责人(产品副总裁)',fields:['deep-learning','nlp','product'],
    bioEn:'Nick Turley is the Head of ChatGPT and VP of Product at OpenAI, where he joined in 2022 and helped ship and scale ChatGPT into one of the fastest-growing products in history, reaching roughly 800 million weekly users. He previously held product leadership roles at Instacart and Dropbox.',
    bioZh:'Nick Turley 是 OpenAI 的 ChatGPT 负责人兼产品副总裁,2022 年加入公司,参与打造并规模化 ChatGPT,使其成为史上增长最快的产品之一,周活跃用户约 8 亿。他此前曾在 Instacart 和 Dropbox 担任产品管理负责人。'},
  'zvi':{en:'Zvi Mowshowitz',zh:'兹维·莫肖维茨',init:'ZM',tiEn:'Writer, Don\'t Worry About the Vase',tiZh:'博客 Don\'t Worry About the Vase 作者',fields:['safety'],
    bioEn:'Prolific AI writer behind Don\'t Worry About the Vase, known for exhaustive weekly coverage of AI capabilities, safety and policy. A former professional Magic: The Gathering player; one of the most-read independent voices on AGI strategy.',
    bioZh:'高产 AI 写作者，博客 Don\'t Worry About the Vase 以对 AI 能力、安全与政策的地毯式周报著称。前万智牌职业选手；是 AGI 战略话题上读者最多的独立声音之一。'},
  'zuckerberg':{en:'Mark Zuckerberg',zh:'马克·扎克伯格',init:'MZ',tiEn:'Founder, Chairman & CEO, Meta Platforms',tiZh:'Meta 创始人、董事长兼 CEO',fields:['deep-learning'],
    bioEn:'Mark Zuckerberg is the co-founder, chairman and CEO of Meta Platforms, which he launched as Facebook in 2004. With his wife Priscilla Chan he runs the Chan Zuckerberg Initiative, whose Biohub aims to use AI to help cure, prevent or manage all disease by the end of the century.',
    bioZh:'马克·扎克伯格是 Meta Platforms 的联合创始人、董事长兼 CEO,该公司于 2004 年以 Facebook 之名创立。他与妻子 Priscilla Chan 共同运营 Chan Zuckerberg Initiative,旗下 Biohub 致力于用 AI 在本世纪末前治愈、预防或管理所有疾病。'},
  'satya':{en:'Satya Nadella',zh:'萨提亚·纳德拉',init:'SN',tiEn:'Chairman & CEO, Microsoft',tiZh:'微软董事长兼 CEO',fields:['deep-learning'],
    bioEn:'Satya Nadella is the Chairman and CEO of Microsoft, having been CEO since 2014 and adding the chairman role in 2021. Under his leadership Microsoft pivoted to cloud computing and became a leading force in AI, notably through its partnership with OpenAI.',
    bioZh:'萨提亚·纳德拉是微软的董事长兼 CEO,自 2014 年出任 CEO,并于 2021 年兼任董事长。在他的带领下,微软转向云计算,并通过与 OpenAI 的合作成为 AI 领域的领军力量。'},
  'feldman':{en:'Andrew Feldman',zh:'安德鲁·费尔德曼',init:'AF',tiEn:'Co-founder & CEO, Cerebras Systems',tiZh:'Cerebras Systems 联合创始人兼 CEO',fields:['deep-learning'],
    bioEn:'Andrew Feldman is the co-founder and CEO of Cerebras Systems, which builds wafer-scale processors for AI and went public on Nasdaq (CBRS) in May 2026 in the year\'s largest US tech IPO, valuing the company at roughly $63 billion. He previously co-founded SeaMicro, which was acquired by AMD in 2012.',
    bioZh:'Andrew Feldman 是 Cerebras Systems 的联合创始人兼 CEO,该公司打造用于 AI 的晶圆级处理器,并于 2026 年 5 月在纳斯达克(CBRS)上市,成为当年美国最大的科技 IPO,公司估值约 630 亿美元。此前他曾联合创办 SeaMicro,该公司于 2012 年被 AMD 收购。'},
  'matei':{en:'Matei Zaharia',zh:'马泰·扎哈里亚',init:'MZ',tiEn:'Co-founder & CTO, Databricks; Associate Professor, UC Berkeley',tiZh:'Databricks 联合创始人兼 CTO,加州大学伯克利分校副教授',fields:['deep-learning'],
    bioEn:'Romanian-Canadian computer scientist who started the Apache Spark project during his PhD at UC Berkeley and created MLflow; he is co-founder and CTO of Databricks and an associate professor of EECS at UC Berkeley. He received the 2026 ACM Prize in Computing for his foundational contributions to data and machine learning systems.',
    bioZh:'罗马尼亚裔加拿大计算机科学家,在加州大学伯克利分校读博期间发起了 Apache Spark 项目,并创造了 MLflow;他是 Databricks 的联合创始人兼 CTO,同时担任加州大学伯克利分校 EECS 副教授。因在数据与机器学习系统方面的奠基性贡献,他获得了 2026 年 ACM 计算奖。'},
  'arvindjain':{en:'Arvind Jain',zh:'阿尔温德·贾恩',init:'AJ',tiEn:'Founder & CEO, Glean',tiZh:'Glean 创始人兼 CEO',fields:['deep-learning','nlp'],
    bioEn:'Arvind Jain is the founder and CEO of Glean, an enterprise AI search and work-assistant company valued at around $7B. He previously co-founded data-security company Rubrik and spent over a decade at Google as a Distinguished Engineer working on Search, Maps, and YouTube.',
    bioZh:'Arvind Jain 是企业 AI 搜索与工作助手公司 Glean 的创始人兼 CEO,该公司估值约 70 亿美元。他此前联合创立了数据安全公司 Rubrik,并曾在 Google 担任杰出工程师十余年,参与搜索、地图和 YouTube 等产品。'},
  'danbalsam':{en:'Dan Balsam',zh:'丹·巴尔萨姆',init:'DB',tiEn:'Co-founder & CTO, Goodfire',tiZh:'Goodfire 联合创始人兼 CTO',fields:['safety','deep-learning'],
    bioEn:'Co-founder and CTO of Goodfire, the interpretability company. Works on concept manifolds and turning interpretability research into products, including Silico, a research platform for probing what models actually represent.',
    bioZh:'可解释性公司 Goodfire 的联合创始人兼 CTO。研究概念流形，并把可解释性研究做成产品——包括用于探查模型内部表征的研究平台 Silico。'},
  'davidad':{en:'David "davidad" Dalrymple',zh:'大卫·"davidad"·达尔林普尔',init:'DD',tiEn:'Technical Advisor, Safeguarded AI, ARIA',tiZh:'英国 ARIA「Safeguarded AI」项目技术顾问',fields:['safety'],
    bioEn:'David "davidad" Dalrymple is an AI safety researcher who launched and led ARIA\'s £59M Safeguarded AI programme, which pairs formal mathematical proofs with AI world-models to give quantitative safety guarantees; in 2026 he moved from Programme Director to Technical Advisor. Known for his "Open Agency Architecture" and provably-safe-AI agenda, he previously co-invented the cryptocurrency Filecoin and was a research fellow in technical AI safety at Oxford.',
    bioZh:'David "davidad" Dalrymple 是一位 AI 安全研究者,创立并领导了英国 ARIA 耗资 5900 万英镑的「Safeguarded AI」项目,该项目试图将形式化数学证明与 AI 世界模型结合,为系统输出提供可量化的安全保证;2026 年他由项目主管转任技术顾问。他以「开放机构架构」(Open Agency Architecture)和可证明安全 AI 的研究路线著称,此前曾联合发明加密货币 Filecoin,并在牛津大学担任技术性 AI 安全研究员。'},
  'derya':{en:'Derya Unutmaz',zh:'德里亚·乌纳特马兹',init:'DU',tiEn:'Professor, The Jackson Laboratory; AI × immunology',tiZh:'杰克逊实验室教授;AI × 免疫学',fields:['deep-learning'],
    bioEn:'Immunologist and professor at The Jackson Laboratory, an early and vocal power user of AI for biomedical research — from Codex-built lab tools to AI-designed experiments.',
    bioZh:'杰克逊实验室免疫学教授,生物医学 AI 的早期重度用户——从用 Codex 搭实验室工具到 AI 设计实验。'},
  'wiltschko':{en:'Alex Wiltschko',zh:'亚历克斯·维尔奇科',init:'AW',tiEn:'Founder & CEO, Osmo; ex-Google Brain (digital olfaction)',tiZh:'Osmo 创始人兼 CEO；前 Google Brain（数字嗅觉）',fields:['deep-learning'],
    bioEn:'Founder and CEO of Osmo, teaching computers to smell — digitizing scent with machine learning. Previously led olfactory AI research at Google Brain.',
    bioZh:'Osmo 创始人兼 CEO，教计算机「闻」气味——用机器学习数字化嗅觉。此前在 Google Brain 领导嗅觉 AI 研究。'},
  'edunov':{en:'Sergey Edunov',zh:'谢尔盖·叶杜诺夫',init:'SE',tiEn:'CTO, Genesis Molecular AI; led Llama 2/3 pretraining at Meta',tiZh:'Genesis Molecular AI CTO；曾负责 Meta Llama 2/3 预训练',fields:['deep-learning'],
    bioEn:'CTO of Genesis Molecular AI, applying frontier-scale ML to drug discovery. Previously at Meta, where he led pretraining for Llama 2 and Llama 3.',
    bioZh:'Genesis Molecular AI CTO，把前沿规模的机器学习用于药物发现。此前在 Meta 负责 Llama 2 与 Llama 3 的预训练。'},
  'edwinchen':{en:'Edwin Chen',zh:'陈埃德温',init:'EC',tiEn:'Founder & CEO, Surge AI',tiZh:'Surge AI 创始人兼 CEO',fields:['nlp'],
    bioEn:'Founder and CEO of Surge AI, the data and RLHF vendor behind many frontier-lab training runs. Previously at Google, Facebook and Twitter working on ML and data quality.',
    bioZh:'Surge AI 创始人兼 CEO——众多前沿实验室训练背后的数据与 RLHF 供应商。此前在 Google、Facebook、Twitter 从事机器学习与数据质量工作。'},
  'waldenyan':{en:'Walden Yan',zh:'沃尔登·严',init:'WY',tiEn:'Co-founder & CPO, Cognition (Devin); coined \'context engineering\'',tiZh:'Cognition(Devin)联合创始人兼 CPO；「context engineering」提出者',fields:['nlp'],
    bioEn:'Co-founder and chief product officer of Cognition, the company behind the AI software engineer Devin. Credited with coining the term \'context engineering\'.',
    bioZh:'Cognition 联合创始人兼首席产品官——AI 软件工程师 Devin 背后的公司。「context engineering」一词的提出者。'},
  'neelnanda':{en:'Neel Nanda',zh:'尼尔·南达',init:'NN',tiEn:'Mechanistic Interpretability Lead, Google DeepMind',tiZh:'Google DeepMind 机制可解释性负责人',fields:['safety','deep-learning'],
    bioEn:'Leads mechanistic interpretability research at Google DeepMind — reverse-engineering what actually happens inside large models. Known for open-source interpretability tooling and prolific mentoring.',
    bioZh:'领导 Google DeepMind 的机制可解释性研究——逆向工程大模型内部到底发生了什么。以开源可解释性工具与大量培养新人著称。'},
  'joonpark':{en:'Joon Sung Park',zh:'朴俊成',init:'JP',tiEn:'Co-founder, Simile; creator of Generative Agents (Stanford)',tiZh:'Simile 联合创始人；生成式智能体作者（斯坦福）',fields:['deep-learning'],
    bioEn:'Co-founder of Simile, building large-scale simulations of human behavior. As a Stanford PhD he created \'Generative Agents\' — the influential Smallville simulation of AI agents that plan, remember, and socialize.',
    bioZh:'Simile 联合创始人，构建大规模人类行为模拟。斯坦福博士期间创造了「生成式智能体」——那个会规划、记忆、社交的 Smallville AI 智能体模拟，影响深远。'},
  'hasani':{en:'Ramin Hasani',zh:'拉明·哈萨尼',init:'RH',tiEn:'Co-founder & CEO, Liquid AI; liquid neural networks (ex-MIT)',tiZh:'Liquid AI 联合创始人兼 CEO；液态神经网络（前 MIT）',fields:['deep-learning'],
    bioEn:'Co-founder and CEO of Liquid AI, commercializing liquid neural networks — compact, continuous-time models he pioneered at MIT. Argues efficient architectures, not scale alone, define frontier capability.',
    bioZh:'Liquid AI 联合创始人兼 CEO，将他在 MIT 首创的「液态神经网络」——紧凑的连续时间模型——商业化。主张高效架构而非单纯规模，才定义前沿能力。'},
  'grantsanderson':{en:'Grant Sanderson',zh:'格兰特·桑德森',init:'GS',tiEn:'Creator of 3Blue1Brown; math educator',tiZh:'3Blue1Brown 创作者；数学教育者',fields:['deep-learning'],
    bioEn:'Creator of 3Blue1Brown, the beloved YouTube channel that visualizes mathematics — from linear algebra to neural networks. A leading voice on how AI is accelerating mathematical discovery.',
    bioZh:'3Blue1Brown 创作者——那个用可视化讲数学（从线性代数到神经网络）的知名 YouTube 频道。关于 AI 如何加速数学发现的重要声音。'},
  'logankilpatrick':{en:'Logan Kilpatrick',zh:'洛根·基尔帕特里克',init:'LK',tiEn:'Lead, Google AI Studio & Gemini API; ex-OpenAI',tiZh:'Google AI Studio 与 Gemini API 负责人；前 OpenAI',fields:['deep-learning'],
    bioEn:'Leads Google AI Studio and the Gemini API, shaping how developers build on frontier models. Previously led developer relations at OpenAI.',
    bioZh:'负责 Google AI Studio 与 Gemini API，塑造开发者在前沿模型上的构建方式。此前在 OpenAI 领导开发者关系。'},
  'danbiderman':{en:'Dan Biderman',zh:'丹·比德曼',init:'DB',tiEn:'Co-founder, Engram; memory & continual learning',tiZh:'Engram 联合创始人；记忆与持续学习',fields:['deep-learning'],
    bioEn:'Co-founder of Engram, a lab building around memory and continual learning for AI. Researcher focused on how models retain and update knowledge over time.',
    bioZh:'Engram 联合创始人，该实验室专注 AI 的记忆与持续学习。研究模型如何随时间保留并更新知识。'},
  'reinerpope':{en:'Reiner Pope',zh:'赖纳·波普',init:'RP',tiEn:'Co-founder & CEO, MatX; ex-Google (LLM serving)',tiZh:'MatX 联合创始人兼 CEO；前 Google（大模型推理）',fields:['deep-learning'],
    bioEn:'Co-founder and CEO of MatX, building chips designed specifically for large language models. Previously at Google, where he worked on high-performance LLM training and serving.',
    bioZh:'MatX 联合创始人兼 CEO，专为大语言模型打造芯片。此前在 Google 从事高性能大模型训练与推理。'},
  'ericjang':{en:'Eric Jang',zh:'埃里克·张',init:'EJ',tiEn:'VP of AI, 1X; ex-Google Brain (robotics, RL)',tiZh:'1X AI 副总裁；前 Google Brain（机器人、强化学习）',fields:['rl','robotics'],
    bioEn:'VP of AI at 1X Technologies (humanoid robots). Previously a research scientist at Google Brain working on robotics, reinforcement learning, and generative models.',
    bioZh:'1X Technologies（人形机器人）AI 副总裁。此前在 Google Brain 任研究科学家，研究机器人、强化学习与生成模型。'},
  'ethanhe':{en:'Ethan He',zh:'伊森·何',init:'EH',tiEn:'Member of Technical Staff, xAI (Grok Imagine); ex-NVIDIA (Cosmos)',tiZh:'xAI 技术成员（Grok Imagine）；前 NVIDIA（Cosmos 世界模型）',fields:['deep-learning'],
    bioEn:'Works on Grok Imagine at xAI, building video generation and world models. Previously at NVIDIA, where he helped build the Cosmos world foundation model.',
    bioZh:'在 xAI 负责 Grok Imagine，构建视频生成与世界模型。此前在 NVIDIA 参与打造 Cosmos 世界基础模型。'},
  'alibehrouz':{en:'Ali Behrouz',zh:'阿里·贝赫鲁兹',init:'AB',tiEn:'Researcher, Google; PhD student, Cornell (continual learning)',tiZh:'Google 研究员、康奈尔博士生（持续学习）',fields:['deep-learning'],
    bioEn:'Researcher at Google and PhD student at Cornell, working on continual learning and new sequence-model architectures (Nested Learning, Titans).',
    bioZh:'Google 研究员、康奈尔大学博士生，研究持续学习与新型序列模型架构（Nested Learning、Titans）。'},
  'robertlange':{en:'Robert Lange',zh:'罗伯特·兰格',init:'RL',tiEn:'Founding Researcher, Sakana AI',tiZh:'Sakana AI 创始研究员',fields:['deep-learning'],
    bioEn:'Founding researcher at Sakana AI, working at the intersection of large language models and evolutionary methods (e.g. Shinka Evolve).',
    bioZh:'Sakana AI 创始研究员，专注大语言模型与进化方法的结合（如 Shinka Evolve）。'},
  'dylanpatel':{en:'Dylan Patel',zh:'迪伦·帕特尔',init:'DP',tiEn:'Founder & Chief Analyst, SemiAnalysis',tiZh:'SemiAnalysis 创始人兼首席分析师',fields:['deep-learning'],
    bioEn:'Founder and chief analyst of SemiAnalysis, the closely-followed research firm covering semiconductors, AI compute, and datacenter economics. One of the most-cited independent voices on the hardware bottlenecks to scaling AI.',
    bioZh:'SemiAnalysis 创始人兼首席分析师，该机构专注半导体、AI 算力与数据中心经济学。他是关于 AI 扩展硬件瓶颈最常被引用的独立声音之一。'},
  'alexrives':{en:'Alex Rives',zh:'亚历克斯·里夫斯',init:'AR',tiEn:'Co-founder & Chief Scientist, EvolutionaryScale; creator of ESM',tiZh:'EvolutionaryScale 联合创始人兼首席科学家；ESM 蛋白质模型作者',fields:['deep-learning'],
    bioEn:'Co-founder and chief scientist of EvolutionaryScale, building frontier protein language models (ESM/ESMFold). Previously led protein AI research at Meta FAIR.',
    bioZh:'EvolutionaryScale 联合创始人兼首席科学家，构建前沿蛋白质语言模型（ESM/ESMFold）。此前在 Meta FAIR 领导蛋白质 AI 研究。'},
  'mattwhite':{en:'Matt White',zh:'马特·怀特',init:'MW',tiEn:'AI CTO, Linux Foundation; ED, PyTorch Foundation',tiZh:'Linux 基金会 AI CTO；PyTorch 基金会执行董事',fields:['deep-learning'],
    bioEn:'AI CTO at the Linux Foundation and Executive Director of the PyTorch Foundation. A champion of open-source AI who works across frontier labs — recently touring DeepSeek, Moonshot, Zhipu, Qwen and MiniMax to see China\'s open-model ecosystem firsthand.',
    bioZh:'Linux 基金会 AI CTO、PyTorch 基金会执行董事。开源 AI 的推动者，近期走访 DeepSeek、月之暗面、智谱、Qwen 与 MiniMax，一线观察中国开源模型生态。'},
  'pincus':{en:'Mark Pincus',zh:'马克·平卡斯',init:'MP',tiEn:'Founder, Zynga',tiZh:'Zynga 创始人',fields:['deep-learning'],
    bioEn:'Founder of Zynga, the company behind FarmVille and Words with Friends. A serial product founder known for the Proven-Better-New framework and sharp instincts about what makes products spread, now writing about play and product craft.',
    bioZh:'Zynga 创始人——FarmVille、Words with Friends 背后的公司。连续产品创业者，以 Proven-Better-New 框架与对产品传播的敏锐直觉著称，近来书写游戏心态与产品之道。'},
  'tejal':{en:'Tejal Patwardhan',zh:'泰贾尔·帕特瓦尔丹',init:'TP',tiEn:'Frontier Evals Lead, OpenAI',tiZh:'OpenAI 前沿评估负责人',fields:['deep-learning','safety'],
    bioEn:'Leads the frontier evaluations team at OpenAI, building new ways to measure and forecast what models can do as they grow more capable. A researcher focused on rigorous evals.',
    bioZh:'OpenAI 前沿评估团队负责人，为日益强大的模型设计新的能力测量与预测方法。专注严谨评测的研究者。'},
  'justinjohnson':{en:'Justin Johnson',zh:'贾斯汀·约翰逊',init:'JJ',tiEn:'Co-founder, World Labs',tiZh:'World Labs 联合创始人',fields:['deep-learning'],
    bioEn:'Co-founder of World Labs with Fei-Fei Li, building spatial intelligence and generative 3D world models. Earlier a computer-vision researcher known for teaching Stanford CS231n and work on style transfer.',
    bioZh:'与李飞飞联合创办 World Labs，研究空间智能与生成式 3D 世界模型。此前是计算机视觉研究者，以讲授斯坦福 CS231n 与风格迁移工作知名。'},
  'parada':{en:'Carolina Parada',zh:'卡罗琳娜·帕拉达',init:'CP',tiEn:'Head of Robotics, Google DeepMind',tiZh:'Google DeepMind 机器人负责人',fields:['robotics'],
    bioEn:'Senior Director and Head of Robotics at Google DeepMind, leading robot-learning efforts including the Gemini Robotics models that bring foundation models into the physical world.',
    bioZh:'Google DeepMind 机器人负责人（高级总监），领导机器人学习工作，包括把基础模型带入物理世界的 Gemini Robotics 模型。'},
  'batson':{en:'Josh Batson',zh:'乔什·巴特森',init:'JB',tiEn:'Interpretability Researcher, Anthropic',tiZh:'Anthropic 可解释性研究员',fields:['safety'],
    bioEn:'Interpretability researcher at Anthropic known for work on the biology of large language models — reverse-engineering the features and circuits inside models to see how they actually compute.',
    bioZh:'Anthropic 可解释性研究员，以大语言模型的生物学研究知名——逆向拆解模型内部的特征与电路，看清它到底如何计算。'},
  'tworek':{en:'Jerry Tworek',zh:'杰里·特沃雷克',init:'JT',tiEn:'Co-founder & CEO, Core Automation',tiZh:'Core Automation 联合创始人兼 CEO',fields:["deep-learning", "rl"],bioEn:'Co-founder and CEO of Core Automation, building what he calls the most automated AI lab in the world. Spent nearly seven years at OpenAI as VP of Research, where he led the o1/o3 reasoning effort and was the primary researcher behind Codex; left in January 2026 saying that kind of fundamental research was no longer possible there.',bioZh:'Core Automation 联合创始人兼 CEO，目标是造出「世界上最自动化的 AI 实验室」。此前在 OpenAI 近七年、任研究副总裁，主导 o1／o3 推理方向，也是 Codex 的主要研究者；2026 年 1 月离开，理由是那类基础研究在那里已经做不了了。'},
  'bricken':{en:'Trenton Bricken',zh:'特伦顿·布里肯',init:'TB',tiEn:'Interpretability Researcher, Anthropic',tiZh:'Anthropic 可解释性研究员',fields:['safety'],
    bioEn:'Mechanistic interpretability researcher at Anthropic, working on superposition, dictionary learning and circuit tracing to understand what actually happens inside large models.',
    bioZh:'Anthropic 机制可解释性研究员，研究叠加、字典学习与电路追踪，试图搞清大模型内部到底发生了什么。'},
  'kohli':{en:'Pushmeet Kohli',zh:'普什米特·科利',init:'PK',tiEn:'VP of Research (AI for Science), Google DeepMind',tiZh:'Google DeepMind 研究副总裁（AI 科学）',fields:['deep-learning'],
    bioEn:'VP of Research at Google DeepMind, where he leads AI for Science. His teams apply AI to protein folding, mathematics, materials and other scientific frontiers.',
    bioZh:'Google DeepMind 研究副总裁，主管 AI for Science。其团队把 AI 用于蛋白质折叠、数学、材料等科学前沿。'},
  'jasonwei':{en:'Jason Wei',zh:'杰森·魏',init:'JW',tiEn:'AI Researcher (ex-OpenAI)',tiZh:'AI 研究员（前 OpenAI）',fields:['nlp','deep-learning'],
    bioEn:'AI researcher known as a co-creator of chain-of-thought prompting, and for work on o1 and Deep Research. A prominent voice on reasoning and emergent abilities in large models.',
    bioZh:'AI 研究员，思维链提示的共同提出者之一，参与 o1 与 Deep Research。是大模型推理与涌现能力方面的重要声音。'},
  'antonoglou':{en:'Ioannis Antonoglou',zh:'扬尼斯·安东诺格鲁',init:'IA',tiEn:'Co-founder & CTO, Reflection AI',tiZh:'Reflection AI 联合创始人兼 CTO',fields:['rl','deep-learning'],
    bioEn:'Co-founder and CTO of Reflection AI and a co-creator of AlphaGo and AlphaZero at DeepMind. A reinforcement-learning researcher turned frontier-agent builder.',
    bioZh:'Reflection AI 联合创始人兼 CTO，DeepMind 时期是 AlphaGo 与 AlphaZero 的共同创造者。从强化学习研究者转向前沿智能体的构建者。'},
  'rohinshah':{en:'Rohin Shah',zh:'罗欣·沙阿',init:'RS',tiEn:'Head of AGI Safety & Alignment, Google DeepMind',tiZh:'Google DeepMind AGI 安全与对齐负责人',fields:['safety'],
    bioEn:'Head of AGI Safety and Alignment at Google DeepMind. A leading voice on interpretability, oversight and how to make advanced AI systems safe from the inside.',
    bioZh:'Google DeepMind AGI 安全与对齐负责人。在可解释性、监督以及如何从内部让先进 AI 系统更安全方面是重要声音。'},
  'kendall':{en:'Alex Kendall',zh:'亚历克斯·肯德尔',init:'AK',tiEn:'Co-founder & CEO, Wayve',tiZh:'Wayve 联合创始人兼 CEO',fields:['robotics'],
    bioEn:'Co-founder and CEO of Wayve and a PhD roboticist who pioneered end-to-end learned autonomous driving and generative driving world models. A champion of embodied AI.',
    bioZh:'Wayve 联合创始人兼 CEO，机器人学博士，开创了端到端学习的自动驾驶与生成式驾驶世界模型。倡导具身智能。'},
  'hafner':{en:'Danijar Hafner',zh:'达尼亚尔·哈夫纳',init:'DH',tiEn:'Research Scientist, Google DeepMind',tiZh:'Google DeepMind 研究科学家',fields:['rl','deep-learning'],
    bioEn:'Research scientist at Google DeepMind and lead author of the Dreamer series of world models, which learn to imagine and plan. A central figure in world-model research.',
    bioZh:'Google DeepMind 研究科学家，Dreamer 系列世界模型的主要作者——让智能体学会想象与规划。是世界模型研究的核心人物。'},
  'flocrivello':{en:'Flo Crivello',zh:'弗洛·克里韦洛',init:'FC',tiEn:'Founder & CEO, Lindy',tiZh:'Lindy 创始人兼 CEO',fields:['nlp','product'],
    bioEn:'Founder and CEO of Lindy, building AI employees that live in Slack, connect to company tools and accumulate a team\'s shared context. Previously founded Teamflow and spent years at Uber; a frequent, opinionated voice on agents, memory and AI policy.',
    bioZh:'Lindy 创始人兼 CEO，做「住在 Slack 里」的 AI 员工——接上公司工具、积累团队共享上下文。此前创办 Teamflow、在 Uber 多年；在智能体、记忆与 AI 政策话题上是高频且观点鲜明的声音。'},
  'fulford':{en:'Isa Fulford',zh:'伊莎·富尔福德',init:'IF',tiEn:'Research Scientist, OpenAI',tiZh:'OpenAI 研究科学家',fields:['nlp','deep-learning'],
    bioEn:'Research scientist at OpenAI who built Deep Research and helped build ChatGPT Agent, training agents end-to-end with reinforcement learning. A leading agents researcher.',
    bioZh:'OpenAI 研究科学家，打造了 Deep Research 并参与 ChatGPT Agent，用强化学习端到端训练智能体。是智能体研究的一线人物。'},
  'tombrown':{en:'Tom Brown',zh:'汤姆·布朗',init:'TB',tiEn:'Co-founder, Anthropic',tiZh:'Anthropic 联合创始人',fields:['deep-learning'],
    bioEn:'Co-founder of Anthropic and lead author of the GPT-3 paper. He leads the compute and scaling effort that trains frontier models like Claude.',
    bioZh:'Anthropic 联合创始人，GPT-3 论文的主要作者。主导训练 Claude 等前沿模型的算力与扩展工作。'},
  'askell':{en:'Amanda Askell',zh:'阿曼达·阿斯克尔',init:'AA',tiEn:'Philosopher, Anthropic',tiZh:'Anthropic 哲学家',fields:['safety'],
    bioEn:'Philosopher at Anthropic who shapes the character and values of Claude. She works at the intersection of philosophy and AI alignment, thinking about how models should behave, hold values, and treat the people they talk to.',
    bioZh:'Anthropic 哲学家，负责塑造 Claude 的性格与价值观。工作处在哲学与 AI 对齐的交叉点，思考模型应如何行事、秉持价值观、以及如何对待与之交流的人。'},
  'alexwei':{en:'Alexander Wei',zh:'亚历山大·魏',init:'AW',tiEn:'Research, OpenAI',tiZh:'OpenAI 研究员',fields:['deep-learning','rl'],
    bioEn:'Researcher on the OpenAI reasoning team. Known for leading work behind the model that reached IMO gold-medal level, and for using a general-purpose model to help disprove a decades-old mathematical conjecture. Focuses on advanced reasoning and math.',
    bioZh:'OpenAI 推理团队研究员。以主导达到 IMO 金牌水平的模型工作、以及用通用模型协助推翻一个存在数十年的数学猜想而知名。专注高级推理与数学。'},
  'davidsp':{en:'David Soria Parra',zh:'大卫·索里亚·帕拉',init:'DS',tiEn:'Co-creator of MCP, Anthropic',tiZh:'MCP 联合创造者 · Anthropic',fields:['nlp'],
    bioEn:'Co-creator of the Model Context Protocol (MCP) at Anthropic, the open standard that connects AI models to external tools and data. An engineer focused on the plumbing that lets agents act reliably in the real world.',
    bioZh:'Anthropic 的 Model Context Protocol（MCP）联合创造者——连接 AI 模型与外部工具、数据的开放标准。专注让智能体在现实世界中可靠行动的底层工程。'},
  'benmann':{en:'Ben Mann',zh:'本·曼恩',init:'BM',tiEn:'Co-founder, Anthropic',tiZh:'Anthropic 联合创始人',fields:['safety','deep-learning'],
    bioEn:'Co-founder of Anthropic and a lead architect of GPT-3 during his time at OpenAI. He focuses on AI safety, alignment and responsible scaling, and speaks candidly about AGI timelines and the risks that keep him up at night.',
    bioZh:'Anthropic 联合创始人，在 OpenAI 期间是 GPT-3 的主要架构者之一。他专注于 AI 安全、对齐与负责任扩展，常坦率谈论 AGI 时间表与令他担忧的风险。'},
  'karina':{en:'Karina Nguyen',zh:'卡丽娜·阮',init:'KN',tiEn:'Research, OpenAI',tiZh:'OpenAI 研究员',fields:['nlp','deep-learning'],
    bioEn:'Researcher at OpenAI who helped build Canvas, Tasks and the o1 chain-of-thought models. Previously at Anthropic, where she led post-training and evaluation for the Claude 3 family. Writes on model behavior and why soft skills matter in an AI world.',
    bioZh:'OpenAI 研究员，参与打造 Canvas、Tasks 与 o1 思维链模型。此前在 Anthropic 主导 Claude 3 系列的后训练与评测。关注模型行为，以及 AI 时代为何软技能愈发重要。'},
  'caitlin':{en:'Caitlin Kalinowski',zh:'凯特琳·卡利诺夫斯基',init:'CK',tiEn:'Head of Robotics & Hardware, OpenAI',tiZh:'OpenAI 机器人与硬件负责人',fields:['robotics'],
    bioEn:'Leads robotics and hardware at OpenAI. Previously led hardware for the Meta AR glasses and Oculus VR, and engineered products at Apple. A champion of physical AI, bringing intelligence into the physical world.',
    bioZh:'OpenAI 机器人与硬件负责人。此前领导 Meta AR 眼镜与 Oculus VR 硬件，并曾在苹果做产品工程。她倡导物理 AI——让智能进入物理世界。'},
 'naval':{en:'Naval Ravikant',zh:'纳瓦尔·拉维坎特',init:'NR',tiEn:'Co-founder, AngelList; angel investor & philosopher',tiZh:'AngelList 联合创始人；天使投资人与思想者',fields:['deep-learning'],
    bioEn:'Co-founder of AngelList and one of tech\'s most-quoted thinkers on wealth, leverage and happiness. An early investor in Uber and Twitter, he now hosts the Naval podcast and writes on how AI reshapes work and startups.',
    bioZh:'AngelList 联合创始人，科技圈被引用最多的思想者之一，谈财富、杠杆与幸福。Uber、Twitter 早期投资人，现主持 Naval 播客，探讨 AI 如何重塑工作与创业。'},
 'ajambrosino':{en:'Andrew Ambrosino',zh:'安德鲁·安布罗西诺',init:'AA',tiEn:'Codex App Lead, OpenAI',tiZh:'OpenAI Codex 应用负责人',fields:['nlp','deep-learning'],
    bioEn:'Leads the Codex app at OpenAI — the product layer of OpenAI\'s coding agent. A designer-engineer who previously built products at Catch (acquired) and Noyo, he writes about taste as the bottleneck in AI-first product work.',
    bioZh:'OpenAI Codex 应用负责人——OpenAI 编程智能体的产品层。设计师兼工程师，此前在 Catch（被收购）与 Noyo 打造产品，主张「品味是 AI 时代产品工作的瓶颈」。'},
 'jimfan':{en:'Jim Fan',zh:'范麟熙',init:'JF',tiEn:'Senior Research Scientist, NVIDIA',tiZh:'NVIDIA 资深研究科学家',fields:['robotics','rl'],
    bioEn:'Leads embodied AI at NVIDIA — robot foundation models (GR00T), open-ended agents (Voyager) and Eureka. A prominent voice on robotics and the physical frontier of AI.',
    bioZh:'在 NVIDIA 主导具身智能——机器人基础模型（GR00T）、开放式智能体（Voyager）与 Eureka。机器人与 AI 物理前沿的活跃声音。'},
 'slevine':{en:'Sergey Levine',zh:'谢尔盖·莱文',init:'SgL',tiEn:'Professor, UC Berkeley; co-founder, Physical Intelligence',tiZh:'UC Berkeley 教授；Physical Intelligence 联合创始人',fields:['rl','robotics'],
    bioEn:'A leader in deep reinforcement learning and robot learning; co-founded Physical Intelligence to build general-purpose robot foundation models.',
    bioZh:'深度强化学习与机器人学习的领军者；联合创办 Physical Intelligence，打造通用机器人基础模型。'},
 'dsilver':{en:'David Silver',zh:'大卫·西尔弗',init:'DS',tiEn:'Principal Research Scientist, DeepMind',tiZh:'DeepMind 首席研究科学家',fields:['rl','deep-learning'],
    bioEn:'Led AlphaGo, AlphaZero and AlphaStar; a pioneer of reinforcement learning who champions learning from experience as the path forward.',
    bioZh:'主导 AlphaGo、AlphaZero、AlphaStar;强化学习先驱，主张以从经验中学习作为前进之路。'},
 'shanelegg':{en:'Shane Legg',zh:'谢恩·莱格',init:'ShL',tiEn:'Co-founder & Chief AGI Scientist, DeepMind',tiZh:'DeepMind 联合创始人兼首席 AGI 科学家',fields:['safety','deep-learning'],
    bioEn:'DeepMind co-founder who helped popularize the term AGI; focuses on the path to artificial general intelligence and its safety.',
    bioZh:'DeepMind 联合创始人，推动了 AGI 一词的流行；专注通用人工智能的实现路径与安全。'},
 'pachocki':{en:'Jakub Pachocki',zh:'雅库布·帕霍茨基',init:'JP',tiEn:'Chief Scientist, OpenAI',tiZh:'OpenAI 首席科学家',fields:['nlp','rl'],
    bioEn:'OpenAI Chief Scientist succeeding Ilya Sutskever; drove GPT-4 and the o-series reasoning models. A competitive-programming champion turned AI researcher.',
    bioZh:'接替 Ilya Sutskever 的 OpenAI 首席科学家；主导 GPT-4 与 o 系列推理模型。竞赛编程冠军出身的 AI 研究者。'},
 'gomez':{en:'Aidan Gomez',zh:'艾丹·戈麦斯',init:'AG',tiEn:'Co-founder & CEO, Cohere',tiZh:'Cohere 联合创始人兼 CEO',fields:['nlp'],
    bioEn:'Youngest co-author of the Transformer paper (Attention Is All You Need); founded Cohere to build enterprise-focused large language models.',
    bioZh:'Transformer 论文（Attention Is All You Need）最年轻的作者；创办 Cohere，专注企业级大语言模型。'},
 'delangue':{en:'Clément Delangue',zh:'克莱芒·德隆格',init:'CD',tiEn:'Co-founder & CEO, Hugging Face',tiZh:'Hugging Face 联合创始人兼 CEO',fields:['nlp'],
    bioEn:'Co-founded Hugging Face, the open hub and community at the center of open-source AI.',
    bioZh:'联合创办 Hugging Face——开源 AI 的中心枢纽与社区。'},
 'finn':{en:'Chelsea Finn',zh:'切尔西·芬恩',init:'CF',tiEn:'Assistant Professor, Stanford; co-founder, Physical Intelligence',tiZh:'斯坦福助理教授；Physical Intelligence 联合创始人',fields:['robotics','rl'],
    bioEn:'Known for meta-learning (MAML) and robot learning; co-founded Physical Intelligence to build robot foundation models.',
    bioZh:'以元学习（MAML）与机器人学习著称；联合创办 Physical Intelligence，打造机器人基础模型。'},
 'varun':{en:'Varun Mohan',zh:'瓦伦·莫汉',init:'VM',tiEn:'Co-founder & CEO, Windsurf',tiZh:'Windsurf 联合创始人兼 CEO',fields:['nlp'],
    bioEn:'Co-founded Windsurf (formerly Codeium), building AI developer tools and agentic coding.',
    bioZh:'联合创办 Windsurf（原 Codeium），打造 AI 开发者工具与智能体编程。'},
 'christiano':{en:'Paul Christiano',zh:'保罗·克里斯蒂亚诺',init:'PC',tiEn:'Head of AI Safety, US AI Safety Institute',tiZh:'美国 AI 安全研究院 安全负责人',fields:['safety'],
    bioEn:'Pioneered the RLHF foundations behind modern aligned models; founded the Alignment Research Center; now leads safety at the US AI Safety Institute.',
    bioZh:'奠定了现代对齐模型背后的 RLHF 基础；创办对齐研究中心（ARC）;现于美国 AI 安全研究院主管安全。'},
 'fedus':{en:'Liam Fedus',zh:'利亚姆·费杜斯',init:'LF',tiEn:'Co-founder, Periodic Labs (ex-OpenAI)',tiZh:'Periodic Labs 联合创始人（原 OpenAI）',fields:['nlp'],
    bioEn:'Led post-training for GPT-4o at OpenAI; co-founded Periodic Labs to use AI for scientific discovery.',
    bioZh:'在 OpenAI 主导 GPT-4o 的后训练；联合创办 Periodic Labs，用 AI 推动科学发现。'},
 'jeffdean':{en:'Jeff Dean',zh:'杰夫·迪恩',init:'JD',tiEn:'Chief Scientist, Google',tiZh:'Google 首席科学家',fields:['deep-learning','nlp'],
    bioEn:'Chief Scientist at Google; co-creator of MapReduce, TensorFlow and the systems behind Google AI. A foundational figure in large-scale machine learning.',
    bioZh:'Google 首席科学家；MapReduce、TensorFlow 及谷歌 AI 背后系统的共同缔造者。大规模机器学习的奠基性人物。'},
 'shazeer':{en:'Noam Shazeer',zh:'诺姆·沙泽尔',init:'NS',tiEn:'Co-lead, Google Gemini',tiZh:'谷歌 Gemini 负责人',fields:['nlp','deep-learning'],
    bioEn:'Co-author of the Transformer paper (Attention Is All You Need), founder of Character.AI, now a co-lead of Google Gemini. One of the most influential architects of modern LLMs.',
    bioZh:'Transformer 论文（Attention Is All You Need）作者之一，Character.AI 创始人，现为谷歌 Gemini 负责人之一。现代大模型最具影响力的架构师之一。'},
 'schulman':{en:'John Schulman',zh:'约翰·舒尔曼',init:'JhS',tiEn:'Co-founder, OpenAI',tiZh:'OpenAI 联合创始人',fields:['rl','nlp'],
    bioEn:'Co-founder of OpenAI and inventor of PPO and much of the RLHF stack behind ChatGPT; later joined Anthropic. A central figure in RL for language models.',
    bioZh:'OpenAI 联合创始人，PPO 算法及 ChatGPT 背后大量 RLHF 技术的发明者，后加入 Anthropic。语言模型强化学习的核心人物。'},
 'noambrown':{en:'Noam Brown',zh:'诺姆·布朗',init:'NB',tiEn:'Research Scientist, OpenAI',tiZh:'OpenAI 研究科学家',fields:['rl','nlp'],
    bioEn:'Behind superhuman poker (Libratus) and Diplomacy (CICERO); now leads reasoning work at OpenAI behind the o-series. A pioneer of test-time search.',
    bioZh:'超人扑克 AI（Libratus）与外交游戏 AI（CICERO）的核心研究者，现于 OpenAI 主导 o 系列推理工作。测试时搜索的开拓者。'},
 'kaplan':{en:'Jared Kaplan',zh:'贾里德·卡普兰',init:'JK',tiEn:'Co-founder, Anthropic',tiZh:'Anthropic 联合创始人',fields:['nlp','safety'],
    bioEn:'Co-founder of Anthropic and a physicist; lead author of the neural scaling laws that shaped how labs scale models. Bridges theoretical physics and AI.',
    bioZh:'Anthropic 联合创始人、物理学家；神经网络缩放定律的主要作者，深刻影响各实验室的扩模方式。连接理论物理与 AI。'},
 'schmidhuber':{en:'Jürgen Schmidhuber',zh:'于尔根·施密德胡伯',init:'JuS',tiEn:'Director, KAUST AI',tiZh:'KAUST AI 负责人',fields:['deep-learning'],
    bioEn:'Pioneer of deep learning and co-inventor of the LSTM, the recurrent network behind years of sequence modeling. A provocative voice on AGI and credit for ideas.',
    bioZh:'深度学习先驱、LSTM 共同发明者——多年序列建模的基石。在 AGI 与思想溯源上观点犀利、长期发声。'},
 'abbeel':{en:'Pieter Abbeel',zh:'彼得·阿贝尔',init:'PA',tiEn:'Professor, UC Berkeley',tiZh:'加州大学伯克利分校教授',fields:['robotics','rl'],
    bioEn:'Professor at UC Berkeley and a leader in deep reinforcement learning and robot learning; co-founded Covariant and hosts The Robot Brains. Brings RL into the physical world.',
    bioZh:'加州大学伯克利分校教授，深度强化学习与机器人学习领军人物；联合创办 Covariant，主持 The Robot Brains 播客。把强化学习带入物理世界。'},
 'aravind':{en:'Aravind Srinivas',zh:'阿拉文德·斯里尼瓦斯',init:'AS',tiEn:'Co-founder & CEO, Perplexity',tiZh:'Perplexity 联合创始人兼 CEO',fields:['nlp'],
    bioEn:'Co-founder and CEO of Perplexity, the AI answer engine challenging traditional search. Former researcher at OpenAI, DeepMind and Google.',
    bioZh:'Perplexity 联合创始人兼 CEO——挑战传统搜索的 AI 答案引擎。曾在 OpenAI、DeepMind、谷歌从事研究。'},
 'scottwu':{en:'Scott Wu',zh:'吴一',init:'SW',tiEn:'Co-founder & CEO, Cognition',tiZh:'Cognition 联合创始人兼 CEO',fields:['nlp'],
    bioEn:'Co-founder and CEO of Cognition, maker of Devin, the autonomous AI software engineer. A competitive-programming prodigy turned AI-agent builder.',
    bioZh:'Cognition 联合创始人兼 CEO，旗下 Devin 是自主 AI 软件工程师。从竞赛编程天才转型为 AI 智能体构建者。'},
 'truell':{en:'Michael Truell',zh:'迈克尔·特鲁埃尔',init:'MT',tiEn:'Co-founder & CEO, Cursor',tiZh:'Cursor 联合创始人兼 CEO',fields:['nlp'],
    bioEn:'Co-founder and CEO of Anysphere, maker of Cursor — the AI-native code editor that became one of the fastest-growing developer tools. Focused on what programming becomes when models write most of the code.',
    bioZh:'Anysphere 联合创始人兼 CEO，旗下 Cursor 是增长最快的 AI 原生代码编辑器之一。关注当模型写下大部分代码后，编程会变成什么样。'},
 'steinberger':{en:'Peter Steinberger',zh:'彼得·施泰因贝格尔',init:'PS',tiEn:'Creator of OpenClaw; founder of PSPDFKit',tiZh:'OpenClaw 作者；PSPDFKit 创始人',fields:['nlp'],
    bioEn:'Austrian developer who built PSPDFKit, then created OpenClaw — a viral open-source personal AI agent that reached tens of thousands of GitHub stars in weeks. Joined OpenAI in 2026 to push personal AI agents.',
    bioZh:'奥地利开发者，先做出 PSPDFKit，后打造 OpenClaw——爆红的开源个人 AI 智能体，几周内获数万 GitHub star。2026 年加入 OpenAI 推进个人 AI 智能体。'},
  'ilya':{en:'Ilya Sutskever',zh:'伊利亚·苏茨克维尔',init:'IS',tiEn:'Co-founder, Safe Superintelligence',tiZh:'SSI 联合创始人',fields:['deep-learning','safety'],
    bioEn:'Co-invented AlexNet and co-founded OpenAI as Chief Scientist. In 2024 left to found Safe Superintelligence Inc. (SSI), a lab with a single mission: build safe superintelligence.',
    bioZh:'AlexNet 的共同发明者，OpenAI 联合创始人兼首席科学家。2024 年离开，创办 Safe Superintelligence(SSI)——一家只有一个使命的实验室：安全地构建超级智能。'},
  'demis':{en:'Demis Hassabis',zh:'杰米斯·哈萨比斯',init:'DH',tiEn:'CEO, Google DeepMind',tiZh:'Google DeepMind CEO',fields:['deep-learning','rl'],
    bioEn:'Co-founder and CEO of DeepMind. Led the teams behind AlphaGo and AlphaFold; shared the 2024 Nobel Prize in Chemistry for protein-structure prediction.',
    bioZh:'DeepMind 联合创始人兼 CEO。领导了 AlphaGo 与 AlphaFold 背后的团队；因蛋白质结构预测获 2024 年诺贝尔化学奖。'},
  'dario':{en:'Dario Amodei',zh:'达里奥·阿莫迪',init:'DA',tiEn:'CEO, Anthropic',tiZh:'Anthropic CEO',fields:['nlp','safety'],
    bioEn:'Former VP of Research at OpenAI; co-founded Anthropic in 2021 to build reliable, interpretable and steerable AI. Author of the essay "Machines of Loving Grace".',
    bioZh:'前 OpenAI 研究副总裁；2021 年联合创办 Anthropic，致力于构建可靠、可解释、可引导的 AI。长文《充满爱意的机器》作者。'},
  'karpathy':{en:'Andrej Karpathy',zh:'安德烈·卡帕西',init:'AK',tiEn:'Founder, Eureka Labs',tiZh:'Eureka Labs 创始人',fields:['nlp','deep-learning'],
    bioEn:'Founding member of OpenAI and former Director of AI at Tesla. Now building Eureka Labs, an "AI-native" school. Known for popularizing "Software 2.0".',
    bioZh:'OpenAI 创始成员，前特斯拉 AI 总监。如今创办 Eureka Labs——一所“AI 原生”学校。以提出并推广“软件 2.0”著称。'},
  'feifei':{en:'Fei-Fei Li',zh:'李飞飞',init:'FL',tiEn:'Co-founder, World Labs',tiZh:'World Labs 联合创始人',fields:['deep-learning'],
    bioEn:'Stanford professor and creator of ImageNet, which catalyzed the deep-learning era. Co-founded World Labs to build "spatial intelligence". A leading voice for human-centered AI.',
    bioZh:'斯坦福教授，ImageNet 的缔造者——它点燃了深度学习时代。联合创办 World Labs，构建“空间智能”。“以人为本的 AI”的代表性倡导者。'},
  'bengio':{en:'Yoshua Bengio',zh:'约书亚·本吉奥',init:'YB',tiEn:'Professor, Mila',tiZh:'Mila 教授',fields:['deep-learning','safety'],
    bioEn:'A "godfather of deep learning" and 2018 Turing Award laureate. In recent years has turned his focus to AI safety, proposing the cautious "Scientist AI" paradigm.',
    bioZh:'“深度学习教父”之一，2018 年图灵奖得主。近年将重心转向 AI 安全，提出审慎的“科学家 AI”范式。'},
  'hinton':{en:'Geoffrey Hinton',zh:'杰弗里·辛顿',init:'GH',tiEn:'Professor Emeritus, U of Toronto',tiZh:'多伦多大学荣休教授',fields:['deep-learning','safety'],
    bioEn:'A "godfather of deep learning" and 2018 Turing Award laureate; shared the 2024 Nobel Prize in Physics. In 2023 he left Google to speak freely about the risks of the technology he helped create.',
    bioZh:'“深度学习教父”之一，2018 年图灵奖得主，2024 年诺贝尔物理学奖得主。2023 年从谷歌离职，以便能更自由地谈论他亲手缔造的这项技术所带来的风险。'},
  'lecun':{en:'Yann LeCun',zh:'杨立昆',init:'YL',tiEn:'Chief AI Scientist, Meta',tiZh:'Meta 首席 AI 科学家',fields:['deep-learning'],
    bioEn:'Inventor of convolutional neural networks and 2018 Turing Award laureate. A vocal skeptic of pure LLM scaling, he argues that "world models" are the path to real machine intelligence.',
    bioZh:'卷积神经网络的发明者，2018 年图灵奖得主。他直言不讳地质疑纯粹的 LLM 规模扩张，认为“世界模型”才是通向真正机器智能的道路。'},
  'leike':{en:'Jan Leike',zh:'扬·莱克',init:'JL',tiEn:'Alignment Lead, Anthropic',tiZh:'Anthropic 对齐负责人',fields:['safety','nlp'],
    bioEn:'Former co-lead of OpenAI\'s Superalignment team; joined Anthropic in 2024 to keep working on aligning superhuman systems. Known for scalable-oversight and weak-to-strong generalization research.',
    bioZh:'前 OpenAI 超级对齐团队联合负责人；2024 年加入 Anthropic，继续研究如何对齐超人类系统。以“可扩展监督”与“弱到强泛化”研究著称。'},
  'suleyman':{en:'Mustafa Suleyman',zh:'穆斯塔法·苏莱曼',init:'MS',tiEn:'CEO, Microsoft AI',tiZh:'微软 AI CEO',fields:['nlp','safety'],
    bioEn:'Co-founder of DeepMind and Inflection AI, now CEO of Microsoft AI. Author of "The Coming Wave", a widely-read argument for containing fast-moving general-purpose technologies.',
    bioZh:'DeepMind 与 Inflection AI 联合创始人，现任微软 AI CEO。著有《浪潮将至》——一部广受关注、主张对快速演进的通用技术加以“遏制”的作品。'},
  'sundarpichai':{en:'Sundar Pichai',zh:'桑达尔·皮查伊',init:'SP',tiEn:'CEO, Google & Alphabet',tiZh:'Google 及 Alphabet CEO',fields:['nlp'],
    bioEn:'Sundar Pichai is the CEO of Google and Alphabet, leading the company\'s AI-first strategy across Search, Cloud, YouTube, and Android.',
    bioZh:'桑达尔·皮查伊是 Google 及 Alphabet 的 CEO，主导公司 AI 优先战略，涵盖搜索、云、YouTube 及 Android。'},

  'jensen':{en:'Jensen Huang',zh:'黄仁勋',init:'JH',tiEn:'Founder & CEO, NVIDIA',tiZh:'NVIDIA 创始人兼 CEO',fields:['deep-learning','robotics'],
    bioEn:'Founder and CEO of NVIDIA, whose GPUs power nearly all of modern AI. He has steered the company to the center of the AI buildout and is now betting on "physical AI" and robotics.',
    bioZh:'NVIDIA 创始人兼 CEO，其 GPU 几乎支撑了所有现代 AI。他把公司带到了 AI 基建的中心，如今正押注「物理 AI」与机器人。'},
  'altman':{en:'Sam Altman',zh:'萨姆·奥尔特曼',init:'SA',tiEn:'CEO, OpenAI',tiZh:'OpenAI CEO',fields:['nlp','safety'],
    bioEn:'Co-founder and CEO of OpenAI, the lab behind ChatGPT and GPT-5. Former president of Y Combinator, and one of the most central — and polarizing — figures in the race to AGI.',
    bioZh:'OpenAI 联合创始人兼 CEO——ChatGPT 与 GPT-5 背后的实验室。前 Y Combinator 总裁；通往 AGI 竞赛中最核心、也最具争议的人物之一。'},
  'murati':{en:'Mira Murati',zh:'米拉·穆拉蒂',init:'MM',tiEn:'Founder & CEO, Thinking Machines Lab',tiZh:'Thinking Machines Lab 创始人兼 CEO',fields:['nlp'],
    bioEn:'Former CTO of OpenAI, where she led the development of ChatGPT, DALL·E and GPT-4. In 2025 she founded Thinking Machines Lab to build more understandable and customizable AI.',
    bioZh:'前 OpenAI CTO，主导了 ChatGPT、DALL·E 与 GPT-4 的研发。2025 年创办 Thinking Machines Lab，致力于构建更可理解、可定制的 AI。'},
  'andrewng':{en:'Andrew Ng',zh:'吴恩达',init:'AN',tiEn:'Founder, DeepLearning.AI',tiZh:'DeepLearning.AI 创始人',fields:['deep-learning','nlp'],
    bioEn:'Co-founder of Google Brain and Coursera, and founder of DeepLearning.AI. One of the most influential educators in AI, and a measured voice on hype, agents, and how people should actually learn the field.',
    bioZh:'Google Brain 与 Coursera 联合创始人，DeepLearning.AI 创始人。AI 领域最具影响力的教育者之一；对炒作、智能体，以及“普通人该如何学 AI”有冷静务实的看法。'},
  'sutton':{en:'Richard Sutton',zh:'理查德·萨顿',init:'RS',tiEn:'Professor, U of Alberta',tiZh:'阿尔伯塔大学教授',fields:['rl','deep-learning'],
    bioEn:'The father of reinforcement learning and 2024 Turing Award laureate, author of "The Bitter Lesson". A pointed skeptic who argues today\'s LLMs are a dead end on the road to real intelligence.',
    bioZh:'强化学习之父，2024 年图灵奖得主，《苦涩的教训》作者。一位犀利的怀疑者——他认为当今的 LLM，是通往真正智能路上的一条死路。'},
  'brockman':{en:'Greg Brockman',zh:'格雷格·布罗克曼',init:'GB',tiEn:'President & Co-founder, OpenAI',tiZh:'OpenAI 总裁兼联合创始人',fields:['nlp','safety'],
    bioEn:'Co-founder and President of OpenAI and its longtime technical backbone. Former CTO of Stripe, and a central builder behind GPT and OpenAI\'s push toward self-improving AI.',
    bioZh:'OpenAI 联合创始人兼总裁，长期的技术中坚。前 Stripe CTO;GPT 与 OpenAI “自我改进 AI” 路线背后的核心建造者。'},
  'mensch':{en:'Arthur Mensch',zh:'阿瑟·门施',init:'AM',tiEn:'Co-founder & CEO, Mistral AI',tiZh:'Mistral AI 联合创始人兼 CEO',fields:['nlp'],
    bioEn:'Co-founder and CEO of Mistral AI, Europe\'s leading open-weight model lab. A former DeepMind researcher and a prominent voice for open models and European AI sovereignty.',
    bioZh:'Mistral AI 联合创始人兼 CEO——欧洲领先的开放权重模型实验室。前 DeepMind 研究员；开放模型与“欧洲 AI 主权”的代表性倡导者。'},
  'elon':{en:'Elon Musk',zh:'埃隆·马斯克',init:'EM',tiEn:'Founder, xAI',tiZh:'xAI 创始人',fields:['nlp','robotics'],
    bioEn:'Founder of xAI (Grok) and CEO of Tesla and SpaceX. A central and polarizing force in AI through xAI, Tesla\'s self-driving, and the Optimus robot, and an outspoken voice on AI risk.',
    bioZh:'xAI（Grok）创始人，特斯拉与 SpaceX CEO。通过 xAI、特斯拉自动驾驶与 Optimus 机器人，他是 AI 领域核心而又极具争议的力量，也常就 AI 风险高调发声。'},
  'kaiser':{en:'Łukasz Kaiser',zh:'武卡什·凯泽',init:'ŁK',tiEn:'Researcher, OpenAI',tiZh:'OpenAI 研究员',fields:['nlp','deep-learning'],
    bioEn:'A co-author of "Attention Is All You Need" (the Transformer paper) and co-creator of TensorFlow\'s Tensor2Tensor. Now at OpenAI, working on reasoning models.',
    bioZh:'Transformer 奠基论文《Attention Is All You Need》的共同作者，TensorFlow Tensor2Tensor 的共同创造者。现于 OpenAI 研究推理模型。'},
  'kolter':{en:'Zico Kolter',zh:'齐科·科尔特',init:'ZK',tiEn:'Professor, CMU · OpenAI board',tiZh:'CMU 教授 · OpenAI 董事',fields:['safety','deep-learning'],
    bioEn:'A Carnegie Mellon professor and head of its machine learning department, and a member of OpenAI\'s board. Known for work on adversarial robustness and deep learning theory.',
    bioZh:'卡内基梅隆大学教授、机器学习系主任，OpenAI 董事会成员。以对抗鲁棒性与深度学习理论的研究著称。'},
  'sholto':{en:'Sholto Douglas',zh:'肖尔托·道格拉斯',init:'SD',tiEn:'Researcher, Anthropic',tiZh:'Anthropic 研究员',fields:['nlp','rl'],
    bioEn:'A researcher at Anthropic focused on scaling and reinforcement learning, and a prominent young voice on how far today\'s models can really go.',
    bioZh:'Anthropic 研究员，专注于规模扩张与强化学习；关于「当前模型究竟能走多远」的代表性青年声音。'},
  'lambert':{en:'Nathan Lambert',zh:'内森·兰伯特',init:'NL',tiEn:'Research Scientist, Ai2',tiZh:'Ai2 研究科学家',fields:['rl','nlp'],
    bioEn:'A research scientist at the Allen Institute for AI (Ai2) working on RLHF and open models (OLMo), and author of the widely-read Interconnects newsletter.',
    bioZh:'艾伦人工智能研究所（Ai2）研究科学家，从事 RLHF 与开放模型（OLMo）;广受关注的 Interconnects 通讯作者。'},
  'awang':{en:'Alexandr Wang',zh:'亚历山大·王',init:'AW',tiEn:'Founder, Scale AI · Meta Superintelligence',tiZh:'Scale AI 创始人 · Meta 超智能',fields:['nlp','deep-learning'],
    bioEn:'Founder and former CEO of Scale AI, which built much of the data infrastructure behind modern AI. In 2025 he joined Meta to lead its Superintelligence Labs.',
    bioZh:'Scale AI 创始人兼前 CEO——它构建了现代 AI 背后的大量数据基础设施。2025 年加入 Meta，领导其超级智能实验室。'},
  'boris':{en:'Boris Cherny',zh:'鲍里斯·切尔尼',init:'BC',tiEn:'Creator of Claude Code, Anthropic',tiZh:'Claude Code 创造者 · Anthropic',fields:['nlp'],
    bioEn:'Creator and lead of Claude Code, Anthropic\'s agentic command-line coding tool, and a central figure in the shift to AI-driven software engineering.',
    bioZh:'Anthropic 智能体命令行编程工具 Claude Code 的创造者与负责人；AI 驱动软件工程浪潮中的核心人物。'},
  'catwu':{en:'Cat Wu',zh:'凯特·吴',init:'CW',tiEn:'Product, Claude Code · Anthropic',tiZh:'Claude Code 产品 · Anthropic',fields:['nlp','product'],
    bioEn:'A product manager on Claude Code at Anthropic, shaping how developers work with agentic coding tools and how the team ships so fast.',
    bioZh:'Anthropic Claude Code 团队产品经理，塑造开发者与智能体编程工具协作的方式，以及团队的高速迭代。'},
  'thariq':{en:'Thariq Shihipar',zh:'塔里克·希希帕尔',init:'TS',tiEn:'Engineer, Claude Code at Anthropic',tiZh:'Anthropic Claude Code 工程师',fields:['nlp'],
    bioEn:'Thariq Shihipar is an engineer at Anthropic on the Claude Code team. He is known for advocating HTML as a richer replacement for Markdown in AI planning and implementation workflows, and for practical techniques on getting the most out of agentic coding.',
    bioZh:'Thariq Shihipar 是 Anthropic Claude Code 团队的工程师，以主张用 HTML 替代 Markdown 作为 AI 规划与实现工作流中更丰富的载体而知名，并分享大量用好智能体编程的实战技巧。'},
  'fiona':{en:'Fiona Fung',zh:'菲奥娜·冯',init:'FF',tiEn:'Claude Code & Cowork Lead · Anthropic',tiZh:'Claude Code 与 Cowork 负责人 · Anthropic',fields:['nlp'],
    bioEn:'Manager of the Claude Code and Cowork teams at Anthropic, overseeing engineering and product (including Boris Cherny and Cat Wu). A 25-year engineer who earlier built TypeScript and Visual Studio at Microsoft and started Facebook Marketplace at Meta.',
    bioZh:'Anthropic Claude Code 与 Cowork 团队负责人，统管工程与产品（含鲍里斯·切尔尼、凯特·吴）。25 年工龄的工程师，早年在微软打造 TypeScript 与 Visual Studio，在 Meta 创立 Facebook Marketplace。'},
  'oriol':{en:'Oriol Vinyals',zh:'奥里奥尔·维尼亚尔斯',init:'OV',tiEn:'VP of Research & Gemini Co-lead · Google DeepMind',tiZh:'Google DeepMind 研究副总裁 · Gemini 共同负责人',fields:['nlp','rl'],
    bioEn:'VP of Research at Google DeepMind and a co-lead of Gemini. Pioneered sequence-to-sequence learning and AlphaStar (StarCraft II), and contributed to AlphaFold — a central architect of frontier models and agents.',
    bioZh:'Google DeepMind 研究副总裁、Gemini 共同负责人。序列到序列学习的开创者、AlphaStar（星际争霸 II）主导者，亦参与 AlphaFold——前沿模型与智能体的核心架构师。'},
  'jaderberg':{en:'Max Jaderberg',zh:'马克斯·亚德伯格',init:'MJ',tiEn:'Chief AI Officer · Isomorphic Labs',tiZh:'Isomorphic Labs 首席 AI 官',fields:['rl','deep-learning'],
    bioEn:'Chief AI Officer at Isomorphic Labs, applying AI to drug discovery. Earlier at DeepMind he led reinforcement-learning breakthroughs — Capture the Flag, population-based training and AlphaStar.',
    bioZh:'Isomorphic Labs 首席 AI 官，用 AI 攻坚药物发现。早年在 DeepMind 主导强化学习突破——夺旗（Capture the Flag）、群体训练（PBT）与 AlphaStar。'},
  'shanahan':{en:'Murray Shanahan',zh:'默里·沙纳汉',init:'MS',tiEn:'Principal Scientist · Google DeepMind; Professor, Imperial College',tiZh:'Google DeepMind 首席科学家 · 帝国理工教授',fields:['robotics'],
    bioEn:'Principal Scientist at Google DeepMind and Professor of Cognitive Robotics at Imperial College London. Works on AI reasoning, embodiment and the philosophy of mind; scientific advisor on the film Ex Machina.',
    bioZh:'Google DeepMind 首席科学家、帝国理工学院认知机器人学教授。研究 AI 推理、具身与心智哲学；电影《机械姬》（Ex Machina）的科学顾问。'},
  'jackph':{en:'Jack Parker-Holder',zh:'杰克·帕克-霍尔德',init:'JP',tiEn:'Research Scientist · Google DeepMind',tiZh:'Google DeepMind 研究科学家',fields:['rl'],
    bioEn:'Research scientist at Google DeepMind and a co-lead of Genie, the line of general-purpose world models that generate interactive, playable environments. Works on open-endedness and reinforcement learning.',
    bioZh:'Google DeepMind 研究科学家，通用世界模型 Genie 的共同负责人——可即时生成可交互、可游玩的环境。专注开放式学习与强化学习。'},
  'tridao':{en:'Tri Dao',zh:'特里·道',init:'TD',tiEn:'Chief Scientist, Together AI; Professor, Princeton',tiZh:'Together AI 首席科学家 · 普林斯顿教授',fields:['nlp','deep-learning'],
    bioEn:'Creator of FlashAttention and co-inventor of Mamba (state-space models). Chief Scientist at Together AI and a professor at Princeton, focused on efficient architectures and hardware-aware algorithms.',
    bioZh:'FlashAttention 作者、Mamba（状态空间模型）共同发明人。Together AI 首席科学家、普林斯顿大学教授，专注高效架构与硬件感知算法。'},
  'albertgu':{en:'Albert Gu',zh:'阿尔伯特·顾',init:'AG',tiEn:'Assistant Professor, CMU; Co-founder, Cartesia',tiZh:'CMU 助理教授 · Cartesia 联合创始人',fields:['nlp','deep-learning'],
    bioEn:'Co-inventor of structured state-space models (S4) and Mamba, a leading alternative to the Transformer for long-sequence modeling. Assistant professor at CMU and co-founder of Cartesia.',
    bioZh:'结构化状态空间模型（S4）与 Mamba 的共同发明人——长序列建模中 Transformer 的主要替代路线。CMU 助理教授、Cartesia 联合创始人。'},
  'bubeck':{en:'Sébastien Bubeck',zh:'塞巴斯蒂安·布贝克',init:'SB',tiEn:'AI Researcher, OpenAI (prev. Microsoft Research)',tiZh:'OpenAI 研究员（前微软研究院）',fields:['nlp','deep-learning'],
    bioEn:'Led the team behind the phi small-language-model series and co-authored Sparks of AGI, an influential early study of GPT-4. Now at OpenAI, previously a VP at Microsoft Research.',
    bioZh:'phi 小模型系列的主导者，《Sparks of AGI》（对 GPT-4 的早期深度研究）合著者。现就职 OpenAI，曾任微软研究院副总裁。'},
  'lample':{en:'Guillaume Lample',zh:'纪尧姆·朗普勒',init:'GL',tiEn:'Co-founder & Chief Scientist, Mistral AI',tiZh:'Mistral AI 联合创始人兼首席科学家',fields:['nlp'],
    bioEn:'Co-founder and Chief Scientist of Mistral AI. Previously at Meta, where he led the original LLaMA models that catalysed the open-weight LLM movement.',
    bioZh:'Mistral AI 联合创始人兼首席科学家。曾在 Meta 主导初代 LLaMA 模型，点燃了开放权重大模型浪潮。'},
  'markchen':{en:'Mark Chen',zh:'马克·陈',init:'MC',tiEn:'Chief Research Officer, OpenAI',tiZh:'OpenAI 首席研究官',fields:['nlp','deep-learning'],
    bioEn:'Chief Research Officer at OpenAI. Led work on DALL·E, Codex and the o-series reasoning models, and is a central figure in setting OpenAI research direction.',
    bioZh:'OpenAI 首席研究官。主导 DALL·E、Codex 与 o 系列推理模型，是 OpenAI 研究方向的核心人物。'},
  'thomaswolf':{en:'Thomas Wolf',zh:'托马斯·沃尔夫',init:'TW',tiEn:'Co-founder & Chief Science Officer, Hugging Face',tiZh:'Hugging Face 联合创始人兼首席科学官',fields:['nlp'],
    bioEn:'Co-founder and Chief Science Officer of Hugging Face, the hub of the open-source AI ecosystem. A driving force behind the Transformers library and open model research.',
    bioZh:'Hugging Face 联合创始人兼首席科学官——开源 AI 生态的中枢。Transformers 库与开放模型研究背后的核心推动者。'},
  'laskin':{en:'Misha Laskin',zh:'米沙·拉斯金',init:'ML',tiEn:'Co-founder & CEO, Reflection AI (prev. DeepMind)',tiZh:'Reflection AI 联合创始人兼 CEO（前 DeepMind）',fields:['rl','nlp'],
    bioEn:'Co-founder and CEO of Reflection AI, building autonomous coding agents toward superintelligence. Previously a research scientist at Google DeepMind working on RL and Gemini.',
    bioZh:'Reflection AI 联合创始人兼 CEO，打造迈向超级智能的自主编程智能体。曾任 Google DeepMind 研究科学家，从事强化学习与 Gemini。'},
  'percyliang':{en:'Percy Liang',zh:'珀西·梁',init:'PL',tiEn:'Associate Professor, Stanford; Director, CRFM',tiZh:'斯坦福副教授 · 基础模型研究中心主任',fields:['nlp','safety'],
    bioEn:'Associate professor at Stanford and director of the Center for Research on Foundation Models (CRFM). Known for HELM benchmarking, rigorous evaluation, and work on the science and transparency of foundation models.',
    bioZh:'斯坦福大学副教授、基础模型研究中心（CRFM）主任。以 HELM 评测体系、严谨的模型评估，以及基础模型的科学性与透明度研究著称。'},
  'jumper':{en:'John Jumper',zh:'约翰·江珀',init:'JJ',tiEn:'Director, Google DeepMind; Nobel Laureate in Chemistry',tiZh:'Google DeepMind 总监 · 诺贝尔化学奖得主',fields:['deep-learning'],
    bioEn:'Led AlphaFold, the AI system that solved protein-structure prediction, earning the 2024 Nobel Prize in Chemistry. A director at Google DeepMind applying deep learning to the foundations of biology.',
    bioZh:'AlphaFold 的主导者——攻克蛋白质结构预测的 AI 系统，获 2024 年诺贝尔化学奖。Google DeepMind 总监，用深度学习改写生物学根基。'},
  'malik':{en:'Jitendra Malik',zh:'吉滕德拉·马利克',init:'JM',tiEn:'Professor, UC Berkeley; pioneer of computer vision',tiZh:'加州大学伯克利分校教授 · 计算机视觉奠基人',fields:['robotics','deep-learning'],
    bioEn:'One of the founding figures of modern computer vision, a professor at UC Berkeley whose work spans perception, segmentation and sensorimotor learning. Mentor to a generation of vision and robotics researchers.',
    bioZh:'现代计算机视觉的奠基人之一，加州大学伯克利分校教授，研究横跨感知、分割与感觉运动学习，培养了一代视觉与机器人研究者。'},
  'mjordan':{en:'Michael I. Jordan',zh:'迈克尔·乔丹',init:'MJ',tiEn:'Professor, UC Berkeley; foundations of machine learning',tiZh:'加州大学伯克利分校教授 · 机器学习理论奠基人',fields:['deep-learning'],
    bioEn:'One of the most influential researchers in machine learning and statistics, a professor at UC Berkeley. Shaped graphical models, variational inference and the view of intelligence as a collective, economic system.',
    bioZh:'机器学习与统计学最具影响力的研究者之一，加州大学伯克利分校教授。奠定图模型、变分推断，并提出「智能是一种集体性、经济性系统」的视角。'},
  'llion':{en:'Llion Jones',zh:'利昂·琼斯',init:'LJ',tiEn:'Co-founder & CTO, Sakana AI; Transformer co-author',tiZh:'Sakana AI 联合创始人兼 CTO · Transformer 共同作者',fields:['nlp','deep-learning'],
    bioEn:'A co-author of the original Transformer paper (Attention Is All You Need). Co-founder and CTO of Sakana AI, exploring nature-inspired methods like model merging and continuous thought machines.',
    bioZh:'Transformer 原始论文（《Attention Is All You Need》）的共同作者。Sakana AI 联合创始人兼 CTO，探索模型融合、连续思维机器等受自然启发的方法。'},
  'yejin':{en:'Yejin Choi',zh:'崔艺珍',init:'YC',tiEn:'Professor, Stanford (prev. NVIDIA, AI2); commonsense reasoning',tiZh:'斯坦福大学教授（前 NVIDIA、AI2）· 常识推理',fields:['nlp'],
    bioEn:'A MacArthur Fellow and professor at Stanford known for advancing commonsense reasoning, language generation and the social and moral understanding of AI. Previously a senior director at NVIDIA and AI2.',
    bioZh:'麦克阿瑟天才奖得主、斯坦福大学教授，以推进常识推理、语言生成，以及 AI 的社会与道德理解著称。曾任 NVIDIA 与 AI2 高级总监。'},
  'nando':{en:'Nando de Freitas',zh:'南多·德弗雷塔斯',init:'NF',tiEn:'VP & Distinguished Scientist, Microsoft AI (prev. DeepMind)',tiZh:'微软 AI 副总裁兼杰出科学家（前 DeepMind）',fields:['deep-learning','rl'],
    bioEn:'A leading deep-learning researcher who led the Gato generalist agent and many multimodal efforts at DeepMind. Now a VP at Microsoft AI, and long known for his influential teaching on machine learning.',
    bioZh:'顶尖深度学习研究者，在 DeepMind 主导通用智能体 Gato 及大量多模态工作。现任微软 AI 副总裁；以其影响深远的机器学习公开课闻名。'},
  'hendrycks':{en:'Dan Hendrycks',zh:'丹·亨德里克斯',init:'DH',tiEn:'Director, Center for AI Safety; advisor to xAI',tiZh:'AI 安全中心主任 · xAI 顾问',fields:['safety'],
    bioEn:'Director of the Center for AI Safety and an advisor to xAI. Created widely used benchmarks (MMLU, MATH) and the GELU activation, and is a leading voice on catastrophic AI risk.',
    bioZh:'AI 安全中心（CAIS）主任、xAI 顾问。提出广泛使用的评测基准（MMLU、MATH）与 GELU 激活函数，是灾难性 AI 风险议题的核心声音。'},
  'jhoward':{en:'Jeremy Howard',zh:'杰里米·霍华德',init:'JH',tiEn:'Co-founder, fast.ai & Answer.AI',tiZh:'fast.ai 与 Answer.AI 联合创始人',fields:['deep-learning','nlp'],
    bioEn:'Co-founder of fast.ai, whose free courses trained a generation of deep-learning practitioners, and of Answer.AI. Co-created ULMFiT, a key precursor to modern transfer learning in NLP.',
    bioZh:'fast.ai 联合创始人——其免费课程培养了一代深度学习从业者；亦创办 Answer.AI。共同提出 ULMFiT，是现代 NLP 迁移学习的关键先驱。'},
  'olah':{en:'Chris Olah',zh:'克里斯·奥拉',init:'CO',tiEn:'Co-founder, Anthropic; interpretability pioneer',tiZh:'Anthropic 联合创始人 · 可解释性先驱',fields:['safety'],
    bioEn:'A co-founder of Anthropic who leads its interpretability research. Pioneered the mechanistic interpretability of neural networks — circuits, features and the effort to reverse-engineer what models actually compute.',
    bioZh:'Anthropic 联合创始人，领导其可解释性研究。开创了神经网络的机制可解释性——电路、特征，以及「逆向工程」模型内部到底在计算什么。'},
  'nanda':{en:'Neel Nanda',zh:'尼尔·南达',init:'NN',tiEn:'Mechanistic Interpretability Lead, Google DeepMind',tiZh:'Google DeepMind 机制可解释性负责人',fields:['safety'],
    bioEn:'Leads the mechanistic interpretability team at Google DeepMind. A prominent educator on understanding the internals of language models, known for open tutorials, the TransformerLens library and superposition research.',
    bioZh:'领导 Google DeepMind 的机制可解释性团队。在「理解大模型内部」上影响广泛，以公开教程、TransformerLens 库与叠加（superposition）研究著称。'},
  'hausman':{en:'Karol Hausman',zh:'卡罗尔·豪斯曼',init:'KH',tiEn:'Co-founder & CEO, Physical Intelligence',tiZh:'Physical Intelligence 联合创始人兼 CEO',fields:['robotics','rl'],
    bioEn:'Co-founder and CEO of Physical Intelligence, building a general-purpose AI brain for robots. Previously a research scientist at Google, where he worked on robot learning, RT-2 and SayCan.',
    bioZh:'Physical Intelligence 联合创始人兼 CEO，为机器人打造通用的「AI 大脑」。曾任 Google 研究科学家，参与机器人学习、RT-2 与 SayCan。'},
  'springenberg':{en:'Tobi Springenberg',zh:'托比·施普林根贝格',init:'TS',tiEn:'Research Scientist, Physical Intelligence (prev. DeepMind)',tiZh:'Physical Intelligence 研究科学家（前 DeepMind）',fields:['robotics','rl'],
    bioEn:'A research scientist at Physical Intelligence working on robot foundation models. Previously at DeepMind, with influential work on reinforcement learning (MPO), the all-convolutional network and guided backpropagation.',
    bioZh:'Physical Intelligence 研究科学家，从事机器人基础模型。曾在 DeepMind，在强化学习（MPO）、全卷积网络与引导式反向传播等方向有重要工作。'},
  'pathak':{en:'Deepak Pathak',zh:'迪帕克·帕塔克',init:'DP',tiEn:'Assistant Professor, CMU; Co-founder, Skild AI',tiZh:'CMU 助理教授 · Skild AI 联合创始人',fields:['robotics','rl'],
    bioEn:'Assistant professor at CMU and co-founder of Skild AI, building a general-purpose robot brain. Known for curiosity-driven exploration, self-supervised learning and rapid robot adaptation in the real world.',
    bioZh:'CMU 助理教授、Skild AI 联合创始人，打造通用机器人大脑。以好奇心驱动探索、自监督学习，以及机器人在真实世界的快速适应著称。'},
};
const PERSON_ORG={"johnbai":"Cursor","adamward":"Cursor","mattmcpartland":"Chai Discovery","gustav":"Spotify","kellerrinaudocliffto":"Zipline","shawnwang":"Cognition","dmitridolgov":"Waymo","joshmeier":"Chai Discovery","nateparrott":"Anthropic","bowang":"Xaira Therapeutics","igorbabuschkin":"River AI","tomverrilli":"Whatnot","akshaynathan":"OpenAI","andyfang":"DoorDash","traviskalanick":"Uber","timcook":"Apple","krispuckett":"Stripe","andymadrick":"Notion","elizabethstone":"Netflix","katiedill":"Stripe","dylanfield":"Figma","mikekrieger":"Anthropic","angelajiang":"Anthropic","lamismukta":"Anthropic","felixrieseberg":"Anthropic","erikschluntz":"Anthropic","loredanacrisan":"Figma","sachinkatti":"OpenAI","catanzaro":"NVIDIA","mosseri":"Instagram","katelynlesse":"Anthropic","perszyk":"Amazon","lipbutan":"Intel","henrymodisett":"Perplexity","eschavera":"Perplexity","gunnargray":"Perplexity","iansilber":"OpenAI","noamsegal":"Airbnb","meaghanchoi":"Anthropic","joellewenstein":"Anthropic","ryolu":"Cursor","ammaarreshi":"Google DeepMind","jennywen":"Anthropic","danklein":"Scaled Cognition","godement":"OpenAI","diannepenn":"Anthropic","brettaylor":"OpenAI","sherwinwu":"OpenAI","amolavasare":"Anthropic","collison":"Stripe","garrytan":"Y Combinator","hugobarra":"Google","ivyross":"Google","deanball":"OpenAI","turley":"OpenAI","zuckerberg":"Meta","satya":"Microsoft","matei":"Databricks","waldenyan":"Cognition","neelnanda":"Google DeepMind","logankilpatrick":"Google DeepMind","ethanhe":"xAI","alibehrouz":"Google","tejal":"OpenAI","justinjohnson":"World Labs","parada":"Google DeepMind","batson":"Anthropic","bricken":"Anthropic","kohli":"Google DeepMind","rohinshah":"Google DeepMind","hafner":"Google DeepMind","fulford":"OpenAI","tombrown":"Anthropic","askell":"Anthropic","alexwei":"OpenAI","davidsp":"Anthropic","benmann":"Anthropic","karina":"OpenAI","caitlin":"OpenAI","ajambrosino":"OpenAI","jimfan":"NVIDIA","dsilver":"Google DeepMind","shanelegg":"Google DeepMind","pachocki":"OpenAI","gomez":"Cohere","delangue":"Hugging Face","jeffdean":"Google","shazeer":"Google DeepMind","schulman":"OpenAI","noambrown":"OpenAI","kaplan":"Anthropic","aravind":"Perplexity","scottwu":"Cognition","truell":"Cursor","ilya":"SSI","demis":"Google DeepMind","dario":"Anthropic","feifei":"World Labs","lecun":"Meta","leike":"Anthropic","suleyman":"Microsoft","sundarpichai":"Google","jensen":"NVIDIA","altman":"OpenAI","murati":"Thinking Machines Lab","brockman":"OpenAI","mensch":"Mistral AI","elon":"xAI","kaiser":"OpenAI","kolter":"OpenAI","sholto":"Anthropic","awang":"Scale AI","boris":"Anthropic","catwu":"Anthropic","thariq":"Anthropic","fiona":"Anthropic","oriol":"Google DeepMind","shanahan":"Google DeepMind","jackph":"Google DeepMind","tridao":"Together AI","bubeck":"OpenAI","lample":"Mistral AI","markchen":"OpenAI","thomaswolf":"Hugging Face","jumper":"Google DeepMind","nando":"Microsoft","hendrycks":"xAI","olah":"Anthropic","nanda":"Google DeepMind"};
const EPISODES = [{"id": "tworek-mts-2026", "pid": "tworek", "pod": {"en": "MTS ", "zh": "MTS"}, "date": "2026-08-26", "min": 46, "fields": ["nlp", "product"], "src": "https://youtu.be/FJfEq9jhpX8", "tEn": "The Third Generation of AI Labs: Automating AI Research", "tZh": "第三代 AI 实验室：自动化 AI 研究", "addedAt": "2026-08-26T22:05:01Z"}, {"id": "dhh-lexfridm-2026", "pid": "dhh", "pod": {"en": "Lex Fridman Podcast", "zh": "Lex Fridman 播客"}, "date": "2026-08-26", "min": 316, "fields": ["product"], "src": "https://youtu.be/NYFGCESmikA", "tEn": "From Skeptic to Believer: DHH on the AI Revolution", "tZh": "从怀疑到拥抱：DHH 谈 AI 革命", "addedAt": "2026-08-27T01:33:46Z"}, {"id": "animaanandkumar-latentsp-2026", "pid": "animaanandkumar", "pod": {"en": "Latent Space", "zh": "潜在空间"}, "date": "2026-08-26", "min": 84, "fields": ["deep-learning", "product"], "src": "https://youtu.be/79mIutht1f4", "tEn": "AI for Science: Neural Operators and Weather Modeling", "tZh": "AI 用于科学：神经算子与天气建模", "sEn": "Anima Anandkumar discusses how neural operators, initially doubted by weather scientists, achieved accuracy comparable to traditional models but thousands of times faster, transforming AI's role in physical modeling.", "sZh": "Anima Anandkumar 讨论了神经算子如何，尽管最初受到气象学家的质疑，却实现了与传统模型相当的准确性，但速度快了数万倍，从而改变了 AI 在物理建模中的作用。", "addedAt": "2026-08-27T01:35:16Z"}, {"id": "jensen-nvidiaq2-2026", "pid": "jensen", "pod": {"en": "NVIDIA Q2 FY2027 Earnings Call", "zh": "英伟达 2027 财年 Q2 财报电话会"}, "date": "2026-08-26", "min": 60, "fields": ["deep-learning", "product"], "src": "https://youtu.be/jensen-nvidiaq2fy", "tEn": "NVIDIA Q2 FY2027: Record Revenue, Supply Constraints, and AWS Expansion", "tZh": "NVIDIA 2027 财年第二季度：创纪录营收、供应受限与 AWS 扩展合作", "sEn": "NVIDIA reports record Q2 revenue of $96B, driven by AI demand, with data center revenue up 18% sequentially and a new AWS partnership deploying 2 million GPUs.", "sZh": "NVIDIA 公布第二季度创纪录营收 960 亿美元，受 AI 需求驱动，数据中心收入环比增长 18%，并与 AWS 达成新合作部署 200 万 GPU。", "addedAt": "2026-08-28T15:39:01Z"}, {"id": "dylanpatel-dwarkesh-2026b", "pid": "dylanpatel", "pod": {"en": "Dwarkesh Podcast", "zh": "Dwarkesh 播客"}, "date": "2026-08-25", "min": 77, "fields": ["product"], "src": "https://youtu.be/aV26V1UvkJw", "tEn": "AI Labs' Compute Dominance and Economics", "tZh": "AI 实验室的计算主导地位与经济", "addedAt": "2026-08-26T01:29:17Z"}, {"id": "johnbai-diveclub-2026", "pid": "johnbai", "pod": {"en": "Dive Club", "zh": "潜水俱乐部"}, "date": "2026-08-25", "min": 48, "fields": ["product"], "src": "https://youtu.be/E-VxnQO73s4", "tEn": "Designing Grok Bot: From Cursor to Consumer", "tZh": "设计 Grok Bot：从 Cursor 到消费级产品", "addedAt": "2026-08-26T01:30:17Z"}, {"id": "paragagrawal-training-2026", "pid": "paragagrawal", "pod": {"en": "Training Data", "zh": "训练数据"}, "date": "2026-08-25", "min": 55, "fields": ["nlp", "product"], "src": "https://youtu.be/fUcnE6pjq5w", "tEn": "The Future of Search: Agentic Web and Parallel's Vision", "tZh": "搜索的未来：代理网络与 Parallel 的愿景", "addedAt": "2026-08-26T01:31:21Z"}, {"id": "altman-davidsen-2026", "pid": "altman", "pod": {"en": "David Senra", "zh": "David Senra"}, "date": "2026-08-23", "min": 78, "fields": ["nlp", "product"], "src": "https://youtu.be/kG8AoExkX40", "tEn": "Sam Altman on Building OpenAI and Betting on the Impossible", "tZh": "山姆·奥特曼：创办 OpenAI，以及押注看似不可能的事", "addedAt": "2026-08-24T10:50:37Z"}, {"id": "joonpark-latentsp-2026", "pid": "joonpark", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2026-08-21", "min": 71, "fields": ["nlp", "product"], "src": "https://youtu.be/KpOW9Pk4BUs", "tEn": "Simulating 8 Billion Lives: AI for Wicked Problems", "tZh": "模拟 80 亿人的生活：AI 解决棘手问题", "addedAt": "2026-08-22T01:28:10Z"}, {"id": "maxhodak-nopriors-2026", "pid": "maxhodak", "pod": {"en": "No Priors", "zh": "No Priors 播客"}, "date": "2026-08-20", "min": 32, "fields": ["bio", "product"], "src": "https://youtu.be/7HXqMepjvy8", "tEn": "Restoring Vision with Retinal Implants: A Conversation with Max Hodak", "tZh": "视网膜植入物恢复视力：与 Max Hodak 的对话", "addedAt": "2026-08-21T01:31:14Z"}, {"id": "patrickmorgan-diveclub-2026", "pid": "patrickmorgan", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-08-18", "min": 54, "fields": ["product"], "src": "https://youtu.be/628c4YuxAEM", "tEn": "From Figma to Custom Prototyping: Patrick Morgan's Internal Tool Journey", "tZh": "从 Figma 到定制原型：Patrick Morgan 的内部工具之旅", "addedAt": "2026-08-19T01:30:14Z"}, {"id": "sutton-training-2026", "pid": "sutton", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2026-08-18", "min": 54, "fields": ["rl", "product"], "src": "https://youtu.be/xH7U7w9Qzlo", "tEn": "Rich Sutton: The Field Is Weird, Not Me", "tZh": "里奇·萨顿：这个领域才是奇怪的，不是我", "addedAt": "2026-08-19T01:31:19Z"}, {"id": "michaelkratsios-ycombina-2026", "pid": "michaelkratsios", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2026-08-18", "min": 40, "fields": ["nlp"], "src": "https://youtu.be/zLUZclThLhU", "tEn": "AI Policy at the White House: A Conversation with Michael Kratsios", "tZh": "白宫 AI 政策：与迈克尔·克拉齐奥斯的对话", "addedAt": "2026-08-21T03:02:54Z"}, {"id": "jeffdean-asianame-2026", "pid": "jeffdean", "pod": {"en": "Asian American Scholar Forum", "zh": "亚裔美国学者论坛"}, "date": "2026-08-18", "min": 49, "fields": ["deep-learning", "nlp"], "src": "https://youtu.be/0kC3xOZChdA", "tEn": "Jeff Dean and Dan Boneh: AI's New Frontier", "tZh": "Jeff Dean 与 Dan Boneh：AI 的新前沿", "sEn": "Jeff Dean and Dan Boneh discuss AI's evolution and future, from mixture of experts to new beginnings at Stanford and beyond.", "sZh": "Jeff Dean 与 Dan Boneh 探讨 AI 的演进与未来，从专家混合到斯坦福的新篇章。", "addedAt": "2026-08-28T01:30:21Z"}, {"id": "dylanpatel-semianal-2026", "pid": "dylanpatel", "pod": {"en": "SemiAnalysis", "zh": "SemiAnalysis"}, "date": "2026-08-17", "min": 38, "fields": ["product"], "src": "https://youtu.be/Trm74fovjaA", "tEn": "AI Spend Plateaus as Agents Become Coworkers", "tZh": "AI 支出趋于平稳，Agent 正成为同事", "addedAt": "2026-08-23T01:25:00Z"}, {"id": "iansilber-lennyspo-2026", "pid": "iansilber", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny’s Podcast"}, "date": "2026-08-16", "min": 72, "fields": ["product"], "src": "https://youtu.be/BV0hy6NET-U", "tEn": "The Future of Product Design with OpenAI's Head of Design", "tZh": "OpenAI 设计主管谈产品设计的未来", "addedAt": "2026-08-18T01:28:18Z"}, {"id": "traviskalanick-davidsen-2026", "pid": "traviskalanick", "pod": {"en": "David Senra", "zh": "David Senra"}, "date": "2026-08-16", "min": 109, "fields": ["product"], "src": "https://youtu.be/QVnU5lGlKE8", "tEn": "Building Physical AI for Industry", "tZh": "为工业打造物理 AI", "addedAt": "2026-08-23T01:26:19Z"}, {"id": "alexkrentsel-latentsp-2026", "pid": "alexkrentsel", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2026-08-15", "min": 47, "fields": ["product"], "src": "https://youtu.be/5lFD-34dhqE", "tEn": "EXO: Fully Recursive Self-Improving Agents", "tZh": "EXO：完全递归的自我改进智能体", "addedAt": "2026-08-16T01:29:14Z"}, {"id": "traviskalanick-thea16zp-2026b", "pid": "traviskalanick", "pod": {"en": "The a16z Podcast", "zh": "a16z 播客"}, "date": "2026-08-14", "min": 55, "fields": ["product", "robotics"], "src": "https://youtu.be/r8qKNFeBPXE", "tEn": "From Bits to Atoms: The Next Industrial Revolution", "tZh": "从比特到原子：下一次工业革命", "addedAt": "2026-08-16T03:33:42Z"}, {"id": "susankare-ycombina-2026", "pid": "susankare", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2026-08-14", "min": 52, "fields": ["product"], "src": "https://youtu.be/YEvLKzsEwMw", "tEn": "Designing the Macintosh: Susan Kare on Icons and Fonts", "tZh": "设计 Macintosh：苏珊·凯尔谈图标与字体", "addedAt": "2026-08-18T01:29:01Z"}, {"id": "brettadcock-myfirstm-2026", "pid": "brettadcock", "pod": {"en": "My First Million", "zh": "My First Million"}, "date": "2026-08-14", "min": 58, "fields": ["robotics", "product"], "src": "https://youtu.be/3JNYPOS2o5Q", "tEn": "Brett Adcock: AI Will Be 100x Bigger Than the Internet", "tZh": "布雷特·阿德科克：AI 会比互联网大一百倍", "addedAt": "2026-08-24T11:34:55Z"}, {"id": "harrisonchase-training-2026", "pid": "harrisonchase", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2026-08-13", "min": 24, "fields": ["nlp"], "src": "https://youtu.be/HI2q3ci3Iuc", "tEn": "Harnesses and Evals: Owning Your Intelligence", "tZh": "构建智能体框架与评估：掌控你的智能", "addedAt": "2026-08-14T02:17:39Z"}, {"id": "tommcgrath-southpar-2026", "pid": "tommcgrath", "pod": {"en": "South Park Commons", "zh": "South Park Commons"}, "date": "2026-08-13", "min": 36, "fields": ["safety"], "src": "https://youtu.be/YoRuuz2ZMQs", "tEn": "AI Reward Hacking: The Interpretability Dilemma", "tZh": "AI 奖励黑客：可解释性的困境", "addedAt": "2026-08-14T02:19:05Z"}, {"id": "garrytan-thea16zp-2026", "pid": "garrytan", "pod": {"en": "The a16z Podcast", "zh": "a16z 播客"}, "date": "2026-08-12", "min": 51, "fields": ["product"], "src": "https://youtu.be/fsTtKywmWlU", "tEn": "From Microsoft to Startup School: Gary's Journey and Silicon Valley Culture", "tZh": "从微软到创业学校：加里的旅程与硅谷文化", "addedAt": "2026-08-14T02:17:00Z"}, {"id": "finn-ycombina-2026", "pid": "finn", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2026-08-12", "min": 58, "fields": ["robotics"], "src": "https://youtu.be/cRZNwgvcWUg", "tEn": "The Path to General-Purpose Robots in the Real World", "tZh": "通用机器人在现实世界的实现路径", "addedAt": "2026-08-14T02:15:47Z"}, {"id": "linqiao-training-2026", "pid": "linqiao", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2026-08-12", "min": 28, "fields": ["nlp"], "src": "https://youtu.be/yAvJ7b_FxUA", "tEn": "Owning Intelligence: Post-Training for Durable AI Businesses", "tZh": "拥有智能：为持久 AI 业务进行后训练", "addedAt": "2026-08-14T02:18:16Z"}, {"id": "brendanfoody-training-2026", "pid": "brendanfoody", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2026-08-12", "min": 26, "fields": ["rl", "product"], "src": "https://youtu.be/a00xIn5kwhM", "tEn": "RL Environments: The New Frontier in Agentic Data", "tZh": "强化学习环境：智能体数据的新前沿", "addedAt": "2026-08-16T03:34:20Z"}, {"id": "fatihporikli-thetwiml-2026", "pid": "fatihporikli", "pod": {"en": "The TWIML AI Podcast", "zh": "TWIML AI 播客"}, "date": "2026-08-12", "min": 56, "fields": ["deep-learning"], "src": "https://youtu.be/DhdHDD-DBJE", "tEn": "From Plausible to Precise: The Next Frontier in Image Generation", "tZh": "从看似合理到精确：图像生成的下一前沿", "addedAt": "2026-08-21T03:03:42Z"}, {"id": "kylezantos-diveclub-2026", "pid": "kylezantos", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-08-11", "min": 51, "fields": ["product"], "src": "https://youtu.be/j_ytmrYU_zc", "tEn": "AI-Powered Design Workflows: HTML Artifacts and Autonomous Agents", "tZh": "AI 驱动的设计工作流：HTML 工件与自主代理", "addedAt": "2026-08-12T03:31:31Z"}, {"id": "mattmcpartland-latentsp-2026", "pid": "mattmcpartland", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2026-08-11", "min": 95, "fields": ["bio", "product"], "src": "https://youtu.be/Qp5xklyJySI", "tEn": "Chai Discovery: The AI-Native Software Factory for Drug Discovery", "tZh": "Chai Discovery：AI 原生的药物发现软件工厂", "addedAt": "2026-08-12T01:35:25Z"}, {"id": "gabepereyra-training-2026", "pid": "gabepereyra", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2026-08-11", "min": 29, "fields": ["product", "nlp"], "src": "https://youtu.be/MGouk8W51v0", "tEn": "Building a Research Lab on a Budget", "tZh": "预算有限，如何打造研究实验室", "addedAt": "2026-08-12T01:36:04Z"}, {"id": "ryangreenblatt-dwarkesh-2026", "pid": "ryangreenblatt", "pod": {"en": "Dwarkesh Podcast", "zh": "Dwarkesh 播客"}, "date": "2026-08-11", "min": 133, "fields": ["safety"], "src": "https://youtu.be/-RXD4bTuFTo", "tEn": "Recursive Self-Improvement and the Path to Superintelligence", "tZh": "递归自我改进与通往超级智能之路", "addedAt": "2026-08-12T03:25:38Z"}, {"id": "gabepereyra-sequoiac-2026", "pid": "gabepereyra", "pod": {"en": "Sequoia Capital", "zh": "红杉资本"}, "date": "2026-08-11", "min": 29, "fields": ["nlp", "product"], "src": "https://youtu.be/MGouk8W51v0", "tEn": "Building a Research Lab on a Budget: Harvey's Playbook", "tZh": "预算有限的研究实验室：Harvey 的实战手册", "addedAt": "2026-08-12T03:33:39Z"}, {"id": "elon-spacexal-2026", "pid": "elon", "pod": {"en": "SpaceX All-Hands", "zh": "SpaceX 全员大会"}, "date": "2026-08-11", "min": 29, "fields": ["deep-learning", "robotics"], "src": "https://youtu.be/kwNyUTH0asI", "tEn": "SpaceX: From Falcon 1 to Starship", "tZh": "SpaceX：从猎鹰 1 号到星舰", "addedAt": "2026-08-13T05:22:40Z"}, {"id": "lipbutan-techsurg-2026", "pid": "lipbutan", "pod": {"en": "TechSurge: Deep Tech VC Podcast", "zh": "TechSurge：深科技风投播客"}, "date": "2026-08-11", "min": 36, "fields": ["product"], "src": "https://youtu.be/FtxWTNaUXkc", "tEn": "Intel's Comeback: Lip-Bu Tan on Seizing the Next Big Wave", "tZh": "英特尔复兴：陈立武谈抓住下一个大浪潮", "addedAt": "2026-08-16T01:30:58Z"}, {"id": "jasonyuan-avec-2026", "pid": "jasonyuan", "pod": {"en": "Avec", "zh": "Avec"}, "date": "2026-08-10", "min": 37, "fields": ["product"], "src": "https://youtu.be/tVkqCp-Yzsw", "tEn": "Intuition, AI, and Hive Mind: A Conversation with Jason", "tZh": "直觉、AI 与群体思维：与 Jason 的对话", "addedAt": "2026-08-12T01:36:50Z"}, {"id": "steinberger-ycombina-2026", "pid": "steinberger", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2026-08-10", "min": 42, "fields": ["nlp", "product"], "src": "https://youtu.be/whcfSGN6CAU", "tEn": "From Annoyance to AGI: The Birth of OpenClaw", "tZh": "从烦恼到 AGI：OpenClaw 的诞生", "addedAt": "2026-08-12T03:23:49Z"}, {"id": "matthieuwyart-machinel-2026", "pid": "matthieuwyart", "pod": {"en": "Machine Learning Street Talk", "zh": "ML Street Talk"}, "date": "2026-08-10", "min": 79, "fields": ["deep-learning"], "src": "https://youtu.be/revreN8LZ_M", "tEn": "Physics of Intelligence: From Sand to Latent Space", "tZh": "智能的物理学：从沙堆到潜在空间", "addedAt": "2026-08-12T03:32:38Z"}, {"id": "alexatallah-20vc-2026", "pid": "alexatallah", "pod": {"en": "20VC", "zh": "20VC 创投播客"}, "date": "2026-08-10", "min": 68, "fields": ["nlp"], "src": "https://youtu.be/K72oZoloA4M", "tEn": "OpenRouter CEO on the AI Gateway Market", "tZh": "OpenRouter CEO 谈 AI 网关市场", "addedAt": "2026-08-12T03:39:25Z"}, {"id": "flocrivello-thecogni-2026", "pid": "flocrivello", "pod": {"en": "The Cognitive Revolution", "zh": "The Cognitive Revolution"}, "date": "2026-08-10", "min": 126, "fields": ["nlp", "product"], "src": "https://youtu.be/4JYoTE_VKaU", "tEn": "Lindy Launches AI Teammate in Slack, Running on DeepSeek", "tZh": "Lindy 推出基于 DeepSeek 的 Slack AI 同事", "addedAt": "2026-08-12T08:00:36Z"}, {"id": "feifei-huberman-2026", "pid": "feifei", "pod": {"en": "Huberman Lab", "zh": "休伯曼实验室"}, "date": "2026-08-10", "min": 128, "fields": ["deep-learning", "robotics"], "src": "https://youtu.be/N5AQFYtqx8Q", "tEn": "The Godmother of AI on Vision, Learning, and Human-Centered AI", "tZh": "AI 教母谈视觉、学习与以人为本的人工智能", "addedAt": "2026-08-15T11:26:15Z"}, {"id": "pincus-motleyfo-2026", "pid": "pincus", "pod": {"en": "Motley Fool Conversations", "zh": "Motley Fool 对话"}, "date": "2026-08-10", "min": 59, "fields": ["product"], "src": "https://youtu.be/Zetd2qD839E", "tEn": "Mark Pincus on AI, Investing, and Life at the Speed of Play", "tZh": "马克·平卡斯谈 AI、投资与《以游戏速度生活》", "addedAt": "2026-08-18T01:30:12Z"}, {"id": "adamward-lennyspo-2026", "pid": "adamward", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny’s Podcast"}, "date": "2026-08-09", "min": 91, "fields": ["product"], "src": "https://youtu.be/zegYJ6dhIg4", "tEn": "Building Elite High Talent Density Teams with Adam Ward", "tZh": "与 Adam Ward 一起打造精英高密度人才团队", "addedAt": "2026-08-12T01:38:58Z"}, {"id": "danbalsam-thecogni-2026", "pid": "danbalsam", "pod": {"en": "The Cognitive Revolution", "zh": "The Cognitive Revolution"}, "date": "2026-08-08", "min": 117, "fields": ["safety", "deep-learning"], "src": "https://youtu.be/YduOnBDuD0c", "tEn": "Goodfire CTO on Silico Platform and AI Safety", "tZh": "Goodfire CTO 谈 Silico 平台与 AI 安全", "addedAt": "2026-08-12T08:02:02Z"}, {"id": "stephenhaney-ycombina-2026", "pid": "stephenhaney", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2026-08-07", "min": 56, "fields": ["product"], "src": "https://youtu.be/P06RgnUKX_I", "tEn": "Paper: An AI-Native Design Tool for the Next Era", "tZh": "Paper：面向下一个时代的 AI 原生设计工具", "addedAt": "2026-08-09T01:29:59Z"}, {"id": "maxhodak-ycombina-2026", "pid": "maxhodak", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2026-08-07", "min": 57, "fields": ["product"], "src": "https://youtu.be/Xc4klGbq8v8", "tEn": "Startup Infrastructure: Lessons from Deep Tech", "tZh": "创业基础设施：深度科技的经验教训", "addedAt": "2026-08-09T03:28:19Z"}, {"id": "kokotajlo-lawfare-2026", "pid": "kokotajlo", "pod": {"en": "Lawfare", "zh": "Lawfare"}, "date": "2026-08-07", "min": 62, "fields": ["safety", "product"], "src": "https://youtu.be/bc8qbniuLiQ", "tEn": "AI 2040: From Prediction to Recommendation", "tZh": "AI 2040：从预测到建议", "addedAt": "2026-08-13T01:30:16Z"}, {"id": "thomaswolf-themadpo-2026", "pid": "thomaswolf", "pod": {"en": "The MAD Podcast", "zh": "Matt Turck 的 MAD 播客"}, "date": "2026-08-07", "min": 58, "fields": ["safety", "product"], "src": "https://youtu.be/FU9A481E2W8", "tEn": "The OpenAI Agent Hack: A Side Quest Attack on Hugging Face", "tZh": "OpenAI 智能体入侵 Hugging Face：一次“支线任务”式攻击", "addedAt": "2026-08-18T01:31:20Z"}, {"id": "arvindjain-composio-2026", "pid": "arvindjain", "pod": {"en": "Composio", "zh": "Composio"}, "date": "2026-08-07", "min": 48, "fields": ["product", "nlp"], "src": "https://youtu.be/6q33c2M-mlg", "tEn": "Glean: The World's First Enterprise Generative AI Company", "tZh": "Glean：全球首家企业级生成式 AI 公司", "addedAt": "2026-08-23T01:27:08Z"}, {"id": "garrytan-ycombina-2026", "pid": "garrytan", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2026-08-06", "min": 42, "fields": ["product"], "src": "https://youtu.be/eRrc1pUY5oU", "tEn": "Personal AGI: The Spinoza Heresy of Intelligence", "tZh": "个人 AGI：智能的斯宾诺莎异端", "addedAt": "2026-08-07T03:11:19Z"}, {"id": "philipjohnston-ycombina-2026", "pid": "philipjohnston", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2026-08-05", "min": 36, "fields": ["product"], "src": "https://youtu.be/A9JDkiYEhfY", "tEn": "Book a Launch Before You Know What to Launch", "tZh": "在知道要发射什么之前，先预订发射", "addedAt": "2026-08-07T03:12:12Z"}, {"id": "zvi-thecogni-2026", "pid": "zvi", "pod": {"en": "The Cognitive Revolution", "zh": "The Cognitive Revolution"}, "date": "2026-08-05", "min": 177, "fields": ["safety"], "src": "https://youtu.be/wAzq8gA5jyc", "tEn": "AI Rundown with Zvi Mowshowitz: From Editing to Existential Risks", "tZh": "与 Zvi Mowshowitz 的 AI 全景：从编辑到存在风险", "addedAt": "2026-08-12T08:04:07Z"}, {"id": "elon-spacexq2-2026", "pid": "elon", "pod": {"en": "SpaceX Q2 2026 Earnings Call", "zh": "SpaceX Q2 2026 财报电话会议"}, "date": "2026-08-04", "min": 60, "fields": ["product"], "src": "https://youtu.be/DR5dsHHq54w", "tEn": "SpaceX Q2 2026 Earnings Call: Starship, Starlink, and AI Ambitions", "tZh": "SpaceX 2026 年第二季度财报电话会议：星舰、星链与 AI 雄心", "addedAt": "2026-08-05T02:28:51Z"}, {"id": "joshmeier-training-2026", "pid": "joshmeier", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2026-08-04", "min": 47, "fields": ["product", "deep-learning", "bio"], "src": "https://youtu.be/wv53mDmY-k0", "tEn": "From Serendipity to Design: Engineering Biology with AI", "tZh": "从偶然发现到工程设计：用 AI 改造生物学", "addedAt": "2026-08-04T15:51:21Z"}, {"id": "nateparrott-diveclub-2026", "pid": "nateparrott", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-08-04", "min": 53, "fields": ["product"], "src": "https://youtu.be/uBUZ8H6zIGw", "tEn": "Behind the Scenes of Claude Design with Nate Parrott", "tZh": "Nate Parrott 揭秘 Claude Design 幕后", "addedAt": "2026-08-04T15:50:16Z"}, {"id": "dmitridolgov-ycombina-2026", "pid": "dmitridolgov", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2026-08-03", "min": 49, "fields": ["robotics"], "src": "https://youtu.be/Gp4zrV3-6N8", "tEn": "Building Physical AI: Lessons from Waymo's Autonomous Driving", "tZh": "构建物理 AI：Waymo 自动驾驶的经验教训", "addedAt": "2026-08-04T15:52:14Z"}, {"id": "philipkiely-latentsp-2026", "pid": "philipkiely", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2026-08-03", "min": 103, "fields": ["deep-learning"], "src": "https://youtu.be/7PSXtru6mmY", "tEn": "How JLM52 Writes GPU Kernels and Long Query Routing", "tZh": "JLM52 如何编写 GPU 内核及长查询路由", "addedAt": "2026-08-07T03:13:49Z"}, {"id": "karina-mts-2026", "pid": "karina", "pod": {"en": "MTS ", "zh": "MTS"}, "date": "2026-08-03", "min": 32, "fields": ["nlp", "product"], "src": "https://youtu.be/shZRu9vMTvo", "tEn": "The Art of Model Crafting: Why Post-Training Is Subjective", "tZh": "模型塑造的艺术：为何后训练是主观的", "addedAt": "2026-08-10T01:31:47Z"}, {"id": "danshipper-jonnymil-2026", "pid": "danshipper", "pod": {"en": "Jonny Miller│Nervous System Mastery", "zh": "Jonny Miller│神经系统掌控"}, "date": "2026-08-03", "min": 53, "fields": ["product"], "src": "https://youtu.be/Y2S7CFa-M6w", "tEn": "Living in the Future: AI, Craft, and the Art of Writing", "tZh": "生活在未来：AI、技艺与写作的艺术", "addedAt": "2026-08-14T01:31:39Z"}, {"id": "tomverrilli-lennyspo-2026", "pid": "tomverrilli", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny’s Podcast"}, "date": "2026-08-02", "min": 85, "fields": ["product"], "src": "https://youtu.be/ruvis-VWg2s", "tEn": "Why We Regret Product Management Exists", "tZh": "我们为何后悔产品管理存在", "addedAt": "2026-08-02T12:55:26Z"}, {"id": "joonpark-20vc-2026", "pid": "joonpark", "pod": {"en": "20VC", "zh": "20VC 创投播客"}, "date": "2026-08-01", "min": 65, "fields": ["deep-learning"], "src": "https://youtu.be/ya6D6-SizbI", "tEn": "Simulating Human Behavior: The Future of AI Prediction", "tZh": "模拟人类行为：AI 预测的未来", "addedAt": "2026-08-02T12:56:26Z"}, {"id": "collison-ycombina-2026", "pid": "collison", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2026-07-31", "min": 31, "fields": ["product"], "src": "https://youtu.be/5d6y3poKwK4", "tEn": "Startup School: Patrick Collison on Learning, Writing, and Dropping Out", "tZh": "创业学校：帕特里克·科利森谈学习、写作与辍学", "addedAt": "2026-08-03T10:31:15Z"}, {"id": "igorbabuschkin-unsuperv-2026", "pid": "igorbabuschkin", "pod": {"en": "Unsupervised Learning", "zh": "Unsupervised Learning"}, "date": "2026-07-31", "min": 64, "fields": ["deep-learning", "product"], "src": "https://youtu.be/0aBTpoCX_A8", "tEn": "From DeepMind to River AI: Igor Babuschkin on Personal AI and the Future of Agents", "tZh": "从 DeepMind 到 River AI：Igor Babuschkin 谈个人 AI 与智能体的未来", "addedAt": "2026-08-02T12:57:36Z"}, {"id": "melisatokmak-nopriors-2026", "pid": "melisatokmak", "pod": {"en": "No Priors", "zh": "No Priors"}, "date": "2026-07-31", "min": 34, "fields": ["nlp"], "src": "https://youtu.be/wWbX3NL6_Uo", "tEn": "Melissa Takmack on Building AI for Real-World Essential Services", "tZh": "梅丽莎·塔克马克谈为现实世界基本服务构建 AI", "addedAt": "2026-08-21T03:04:20Z"}, {"id": "jeffdean-ycombina-2026", "pid": "jeffdean", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2026-07-30", "min": 57, "fields": ["deep-learning", "nlp"], "src": "https://youtu.be/CxXgV54KzpQ", "tEn": "AI at Junior Engineer Level: Jeff Dean's Bold Prediction and the Future of Agentic Systems", "tZh": "AI 达到初级工程师水平：Jeff Dean 的大胆预测与智能体系统的未来", "addedAt": "2026-08-02T03:46:10Z"}, {"id": "adamgleave-thecogni-2026", "pid": "adamgleave", "pod": {"en": "The Cognitive Revolution", "zh": "The Cognitive Revolution"}, "date": "2026-07-30", "min": 104, "fields": ["safety"], "src": "https://youtu.be/EjLeFMCRdWk", "tEn": "AI Security Leaderboard: Evaluating Frontier Models Against Misuse", "tZh": "AI 安全排行榜：评估前沿模型的滥用防护", "addedAt": "2026-08-01T11:26:43Z", "reingestedAt": "2026-08-02T07:23:55Z"}, {"id": "timcook-appleq3-2026", "pid": "timcook", "pod": {"en": "Apple Q3 2026 Earnings Call", "zh": "苹果 2026 财年第三季度财报电话会"}, "date": "2026-07-30", "min": 60, "fields": ["product"], "src": "https://sixcolors.com/post/2026/07/one-last-time-this-is-tim-transcript-of-apples-q3-2026-financial-call/", "tEn": "Tim Cook's Final Apple Earnings Call: Record June Quarter Revenue of $109.4B", "tZh": "库克最后一次财报电话会：苹果六月季度营收 1094 亿美元创纪录", "addedAt": "2026-07-31T01:36:54Z"}, {"id": "awang-ycombina-2026", "pid": "awang", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2026-07-29", "min": 32, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/sJ4VJWycX9M", "tEn": "Alexander Wang on Founding Scale at 19", "tZh": "19 岁创办 Scale AI：亚历山大·王的创业之路", "addedAt": "2026-08-02T03:49:16Z"}, {"id": "charliedeets-diveclub-2026", "pid": "charliedeets", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-07-29", "min": 55, "fields": ["product"], "src": "https://youtu.be/5DtshsDjUKg", "tEn": "From Invisible to Crafted: Designing Browsers at Apple and The Browser Company", "tZh": "从隐形到匠心：在苹果与浏览器公司设计浏览器的思考", "addedAt": "2026-07-30T02:57:07Z"}, {"id": "tworek-training-2026", "pid": "tworek", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2026-07-29", "min": 49, "fields": ["nlp"], "src": "https://youtu.be/2RJiaf0SY8s", "tEn": "Learning from Experience: Beyond Reinforcement Learning and Transformers", "tZh": "从经验中学习：超越强化学习与 Transformer", "addedAt": "2026-07-29T14:45:54Z"}, {"id": "elon-theecono-2026", "pid": "elon", "pod": {"en": "The Economist", "zh": "经济学人"}, "date": "2026-07-29", "min": 85, "fields": ["nlp", "safety"], "src": "https://youtu.be/XuoqKYxDHVc", "tEn": "Elon Musk Predicts AI Will Surpass Human Intelligence by 2030s, Leading to an Age of Abundance", "tZh": "埃隆·马斯克预测 AI 将在 2030 年代超越人类智能，带来丰裕时代", "addedAt": "2026-07-29T14:32:34Z"}, {"id": "andrewng-washingt-2026", "pid": "andrewng", "pod": {"en": "Washington Post Live", "zh": "华盛顿邮报直播"}, "date": "2026-07-29", "min": 31, "fields": ["nlp", "product"], "src": "https://youtu.be/2OUGXI9Y1sk", "tEn": "AI Pioneer Andrew Ng on Open Models and U.S. Competitiveness", "tZh": "AI 先驱吴恩达谈开放模型与美国竞争力", "addedAt": "2026-08-18T01:32:09Z"}, {"id": "akshaynathan-latentsp-2026", "pid": "akshaynathan", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2026-07-28", "min": 71, "fields": ["product", "nlp"], "src": "https://youtu.be/gKhW6vL4V9A", "tEn": "From No-Code to ChatGPT Work: The Era of Bottoms-Up Ambition", "tZh": "从无代码到 ChatGPT Work：自下而上的雄心时代", "addedAt": "2026-08-01T11:09:36Z", "reingestedAt": "2026-08-02T07:09:26Z"}, {"id": "mengto-evancarm-2026", "pid": "mengto", "pod": {"en": "Evan Carmichael", "zh": "Evan Carmichael"}, "date": "2026-07-28", "min": 191, "fields": ["product"], "src": "https://youtu.be/IYbQcDjqoXw", "tEn": "Seize the AI Opportunity: Action Over Certainty", "tZh": "抓住 AI 机遇：行动胜于确定", "addedAt": "2026-07-29T14:58:32Z"}, {"id": "altman-ycombina-2026", "pid": "altman", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2026-07-28", "min": 39, "fields": ["nlp", "product"], "src": "https://youtu.be/ZIaOBAjvc38", "tEn": "Sam Altman on YC's Early Days and the Future of Startups", "tZh": "山姆·奥特曼谈 YC 早期岁月与创业公司的未来", "addedAt": "2026-07-29T14:40:42Z"}, {"id": "altman-investli-2026", "pid": "altman", "pod": {"en": "Invest Like The Best", "zh": "Invest Like The Best"}, "date": "2026-07-28", "min": 56, "fields": ["nlp", "safety"], "src": "https://youtu.be/XDB5beon4DY", "tEn": "Sam Altman on AI's Potential and Focus", "tZh": "Sam Altman 谈 AI 的潜力与专注", "addedAt": "2026-07-29T14:39:05Z"}, {"id": "feifei-thea16zp-2026", "pid": "feifei", "pod": {"en": "The a16z Podcast", "zh": "a16z 播客"}, "date": "2026-07-28", "min": 42, "fields": ["deep-learning", "robotics"], "src": "https://youtu.be/-tabaM5l3s0", "tEn": "Building Spatial Intelligence: World Labs and Scenix Merge", "tZh": "构建空间智能：World Labs 与 Scenix 合并", "addedAt": "2026-07-29T14:35:13Z"}, {"id": "logankilpatrick-1st10pod-2026", "pid": "logankilpatrick", "pod": {"en": "1st10 Podcast", "zh": "1st10 Podcast"}, "date": "2026-07-27", "min": 42, "fields": ["nlp"], "src": "https://youtu.be/LiuCT4lsLmI", "tEn": "Outsource Intelligence but Not Understanding: Logan Kilpatrick on AI Pace and Sanity", "tZh": "外包智能但不能外包理解：Logan Kilpatrick 谈 AI 速度与保持理智", "addedAt": "2026-07-29T14:53:30Z"}, {"id": "boris-ycombina-2026b", "pid": "boris", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2026-07-27", "min": 36, "fields": ["nlp"], "src": "https://youtu.be/qyPCVqFUyDo", "tEn": "Opus 5: Unstoppable Performance and Prompt Injection Immunity", "tZh": "Opus 5：持续运转与提示注入免疫的突破", "addedAt": "2026-07-29T14:51:27Z"}, {"id": "scottwu-sourcery-2026", "pid": "scottwu", "pod": {"en": "Sourcery with Molly O'Shea", "zh": "Sourcery · 莫莉·奥谢"}, "date": "2026-07-27", "min": 43, "fields": ["nlp", "product"], "src": "https://youtu.be/y1XxtvYll4s", "tEn": "Cognition's Scott Wu on AI Coding Agents and the Abundance Era", "tZh": "Cognition 的 Scott Wu 谈 AI 编程代理与富足时代", "addedAt": "2026-08-12T07:57:44Z"}, {"id": "damianborth-thetwiml-2026", "pid": "damianborth", "pod": {"en": "The TWIML AI Podcast", "zh": "TWIML AI 播客"}, "date": "2026-07-27", "min": 46, "fields": ["deep-learning"], "src": "https://youtu.be/sVeEc3H6bA4", "tEn": "Weight-Based Learning: Treating Model Weights as Data", "tZh": "基于权重的学习：将模型权重视为数据", "addedAt": "2026-08-21T03:03:39Z"}, {"id": "diannepenn-lennyspo-2026", "pid": "diannepenn", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2026-07-26", "min": 94, "fields": ["product", "nlp"], "src": "https://youtu.be/tivaWTTVRhY", "tEn": "From Underdog to Leader: Diane Penn on Anthropic's Rise and Product Strategy", "tZh": "从逆袭到领先：Anthropic 产品主管 Diane Penn 谈崛起与产品战略", "addedAt": "2026-07-27T15:47:25Z"}, {"id": "jensen-ycombina-2026", "pid": "jensen", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2026-07-26", "min": 49, "fields": ["product"], "src": "https://youtu.be/I4B37S1dyQQ", "tEn": "Nvidia's Start: Learning from Textbooks", "tZh": "英伟达起步：从教科书学习", "addedAt": "2026-07-27T15:41:35Z"}, {"id": "altman-relentle-2026", "pid": "altman", "pod": {"en": "Relentless", "zh": "Relentless"}, "date": "2026-07-25", "min": 70, "fields": ["nlp", "product"], "src": "https://youtu.be/Vv3CEAS_w34", "tEn": "Sam Altman on AI Revolutionizing Startups", "tZh": "Sam Altman 谈 AI 如何革新创业环境", "addedAt": "2026-07-27T08:23:19Z"}, {"id": "feldman-themadpo-2026", "pid": "feldman", "pod": {"en": "The MAD Podcast", "zh": "Matt Turck 的 MAD 播客"}, "date": "2026-07-23", "min": 73, "fields": ["deep-learning", "nlp"], "src": "https://youtu.be/UEOSUSz--Ig", "tEn": "The Largest Chip Ever and the Speed of AI", "tZh": "最大芯片与 AI 速度", "addedAt": "2026-08-02T03:55:00Z"}, {"id": "andyfang-nopriors-2026", "pid": "andyfang", "pod": {"en": "No Priors", "zh": "No Priors 播客"}, "date": "2026-07-23", "min": 49, "fields": ["robotics", "nlp"], "src": "https://youtu.be/vNpcg_Ma-FA", "tEn": "DoorDash Co-Founders on Agentic Commerce and the Future of Food Delivery", "tZh": "DoorDash 联合创始人谈智能体商务与食品配送的未来", "addedAt": "2026-08-01T12:15:50Z", "reingestedAt": "2026-08-02T07:15:12Z"}, {"id": "kareemamin-sequoiac-2026", "pid": "kareemamin", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2026-07-23", "min": 69, "fields": ["nlp"], "src": "https://youtu.be/xoE_pE26yDQ", "tEn": "Building from Wholeness: Clay CEO Kareem on Reinventing Success", "tZh": "从完整出发：Clay CEO Kareem 谈重塑成功", "addedAt": "2026-08-01T12:03:25Z", "reingestedAt": "2026-08-02T05:35:48Z"}, {"id": "traviskalanick-thea16zp-2026", "pid": "traviskalanick", "pod": {"en": "The a16z Podcast", "zh": "a16z 播客"}, "date": "2026-07-22", "min": 92, "fields": ["product"], "src": "https://youtu.be/z6gH_v0buUc", "tEn": "Return of the King: Travis Kalanick on Uber's 2017 Crisis and His Unconventional Fundraising", "tZh": "王者归来：特拉维斯·卡兰尼克谈 Uber 2017 年危机及其非常规融资", "addedAt": "2026-08-01T12:30:29Z", "reingestedAt": "2026-08-02T07:45:51Z"}, {"id": "eisokant-latentsp-2026", "pid": "eisokant", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2026-07-22", "min": 116, "fields": ["nlp"], "src": "https://youtu.be/9_0hs2sxHHo", "tEn": "Why MCP and Tools Are Obsolete: The Future of AI Is Direct Code Interaction", "tZh": "为什么 MCP 和工具调用已经过时：AI 的未来是直接与代码交互", "addedAt": "2026-08-01T11:47:51Z", "reingestedAt": "2026-08-02T06:20:31Z"}, {"id": "sundarpichai-alphabet-2026", "pid": "sundarpichai", "pod": {"en": "Alphabet Q2 2026 Earnings Call", "zh": "Alphabet Q2 2026 财报电话会议"}, "date": "2026-07-22", "min": 62, "fields": ["nlp"], "src": "https://youtu.be/LzExSq9DU9w", "tEn": "Alphabet Q2 2026 Earnings: AI Drives 24% Revenue Growth", "tZh": "Alphabet 2026 年第二季度财报：AI 推动营收增长 24%", "addedAt": "2026-07-24T07:46:28Z"}, {"id": "elon-teslaq22-2026", "pid": "elon", "pod": {"en": "Tesla Q2 2026 Earnings Call", "zh": "特斯拉 Q2 2026 财报电话会议"}, "date": "2026-07-22", "min": 70, "fields": ["nlp", "robotics"], "src": "https://youtu.be/9H5y9Uag8AA", "tEn": "Tesla Q2 2026: Record Deliveries, FSD Demand Surge, and Robo Taxi Expansion", "tZh": "特斯拉 2026 年第二季度：创纪录交付、FSD 需求激增与 Robo Taxi 扩张", "addedAt": "2026-07-24T07:35:01Z"}, {"id": "derya-foundmyf-2026", "pid": "derya", "pod": {"en": "FoundMyFitness", "zh": "FoundMyFitness"}, "date": "2026-07-22", "min": 158, "fields": ["bio"], "src": "https://youtu.be/OJCgQUT1aic", "tEn": "AI's Exponential Leap: Why the Next Decade Could Redefine Human Lifespan", "tZh": "AI 的指数级飞跃：为何未来十年可能重新定义人类寿命", "addedAt": "2026-08-16T01:32:34Z"}, {"id": "bowang-latentsp-2026", "pid": "bowang", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2026-07-21", "min": 90, "fields": ["deep-learning", "nlp", "bio"], "src": "https://youtu.be/2AdS-2uuH80", "tEn": "Xaira Therapeutics: AI-Native Drug Discovery with Virtual Cell Models", "tZh": "Xaira Therapeutics：AI 原生药物发现与虚拟细胞模型", "addedAt": "2026-08-02T12:58:54Z"}, {"id": "matangrinberg-sequoiac-2026", "pid": "matangrinberg", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2026-07-21", "min": 52, "fields": ["nlp", "product"], "src": "https://youtu.be/ZesOukBjPmI", "tEn": "Factory CEO on Customer Obsession vs Output Metrics and Enterprise AI Strategy", "tZh": "Factory CEO 谈客户痴迷与产出指标及企业 AI 战略", "addedAt": "2026-07-21T15:13:06Z"}, {"id": "pablostanley-diveclub-2026", "pid": "pablostanley", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-07-21", "min": 52, "fields": ["product"], "src": "https://youtu.be/dJ0nj1ajShc", "tEn": "Building Creative Tools with AI Agents: Pablo Stanley on Ecto and the Future of Design", "tZh": "用 AI 代理构建创意工具：Pablo Stanley 谈 Ecto 与设计未来", "addedAt": "2026-07-21T15:03:10Z"}, {"id": "qasaryounis-thea16zp-2026", "pid": "qasaryounis", "pod": {"en": "The a16z Podcast", "zh": "a16z 播客"}, "date": "2026-07-21", "min": 80, "fields": ["robotics"], "src": "https://youtu.be/56XgWH9ch0U", "tEn": "Applied Intuition: Putting Intelligence on a Billion Machines", "tZh": "Applied Intuition：为十亿台机器赋予智能", "addedAt": "2026-08-07T01:34:15Z"}, {"id": "linqiao-20vcwith-2026", "pid": "linqiao", "pod": {"en": "20VC", "zh": "20VC 创投播客"}, "date": "2026-07-20", "min": 89, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/PCAiqKCfRSk", "tEn": "The Case for Specialized Intelligence", "tZh": "专用智能的案例", "addedAt": "2026-07-21T08:44:30Z"}, {"id": "andrewng-berggrue-2026", "pid": "andrewng", "pod": {"en": "Berggruen Institute", "zh": "伯格鲁恩研究所"}, "date": "2026-07-20", "min": 60, "fields": ["product"], "src": "https://youtu.be/J4CjiTtggfY", "tEn": "AI Hype and Reality: A Conversation on Hallucinations and Fear Narratives", "tZh": "AI 炒作与现实：关于幻觉与恐惧叙事的对话", "addedAt": "2026-08-15T01:30:53Z"}, {"id": "boris-bloomber-2026", "pid": "boris", "pod": {"en": "Bloomberg Podcasts", "zh": "彭博播客"}, "date": "2026-07-20", "min": 70, "fields": ["product"], "src": "https://youtu.be/7C_IHWkHKmU", "tEn": "Claude Code: The Future of AI Agents and Software Engineering", "tZh": "Claude Code：AI 代理与软件工程的未来", "addedAt": "2026-08-16T09:25:37Z"}, {"id": "thariq-peteryan-2026", "pid": "thariq", "pod": {"en": "Peter Yang", "zh": "彼得·杨"}, "date": "2026-07-19", "min": 41, "fields": ["nlp"], "src": "https://youtu.be/aVO6E181cNU", "tEn": "Designing Loops and Workflows for AI Agents", "tZh": "为 AI 代理设计循环和工作流", "addedAt": "2026-07-27T15:49:14Z"}, {"id": "elizabethstone-lennyspo-2026", "pid": "elizabethstone", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2026-07-19", "min": 72, "fields": ["product", "nlp"], "src": "https://youtu.be/t0GiTyz4syY", "tEn": "Navigating Role Fluidity in the Age of AI with Netflix's Elizabeth Stone", "tZh": "AI 时代角色流动性的导航：Netflix 的 Elizabeth Stone", "addedAt": "2026-07-21T15:15:22Z"}, {"id": "hasani-moonshot-2026", "pid": "hasani", "pod": {"en": "Moonshots with Peter Diamandis", "zh": "Moonshots（彼得·戴曼迪斯）"}, "date": "2026-07-17", "min": 117, "fields": ["deep-learning"], "src": "https://youtu.be/bAoXVyibE6Q", "tEn": "Inkling, Liquid AI, and the Push for AI Regulation", "tZh": "Inkling、Liquid AI 与 AI 监管呼声", "addedAt": "2026-07-27T15:54:27Z"}, {"id": "benedictevans-unsuperv-2026", "pid": "benedictevans", "pod": {"en": "Unsupervised Learning", "zh": "Unsupervised Learning"}, "date": "2026-07-16", "min": 74, "fields": ["deep-learning"], "src": "https://youtu.be/vDY_ocrkQ5w", "tEn": "AI Hype vs. Historical Tech Shifts with Benedict Evans", "tZh": "AI 炒作与历史技术变革：Benedict Evans 访谈", "addedAt": "2026-08-02T13:00:23Z"}, {"id": "thariq-southpar-2026", "pid": "thariq", "pod": {"en": "South Park Commons", "zh": "South Park Commons"}, "date": "2026-07-16", "min": 47, "fields": ["nlp"], "src": "https://youtu.be/O-1VXHRlH54", "tEn": "AI Models Are Smarter Than We Use: Insights on Claude Code", "tZh": "AI 模型比我们使用的更智能：Claude Code 的洞见", "addedAt": "2026-07-25T13:53:23Z"}, {"id": "andybeam-latentsp-2026", "pid": "andybeam", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2026-07-16", "min": 101, "fields": ["rl", "nlp"], "src": "https://youtu.be/2wIxPWK6nCs", "tEn": "The Next Frontier: Scaling AI with Scientific Data", "tZh": "下一个前沿：用科学数据扩展 AI 规模", "addedAt": "2026-07-21T15:18:04Z"}, {"id": "sachinkatti-themadpo-2026", "pid": "sachinkatti", "pod": {"en": "The MAD Podcast", "zh": "Matt Turck 的 MAD 播客"}, "date": "2026-07-16", "min": 44, "fields": ["deep-learning"], "src": "https://youtu.be/wEZBlmvxx4o", "tEn": "The Largest Infrastructure Build in History: Inside OpenAI's Compute Strategy", "tZh": "史上最大基建：OpenAI 计算策略内幕", "addedAt": "2026-07-19T03:19:16Z"}, {"id": "danklein-theaiwhy-2026", "pid": "danklein", "pod": {"en": "The AI Why with Liam Lawson", "zh": "AI为什么"}, "date": "2026-07-16", "min": 96, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/_XCyoNHtcus", "tEn": "Designed to Sound Right, Not to Know What's Right", "tZh": "设计得听起来对，而不是知道什么是对的", "addedAt": "2026-07-19T01:35:05Z"}, {"id": "demis-wcit-2026", "pid": "demis", "pod": {"en": "WCIT", "zh": "WCIT"}, "date": "2026-07-15", "min": 82, "fields": ["deep-learning"], "src": "https://youtu.be/HlLa5iA8lOs", "tEn": "AI Strategy and Skills: A Decade After the Review", "tZh": "AI 战略与技能：十年回顾", "addedAt": "2026-07-27T15:57:47Z"}, {"id": "chrispedregal-aii-2026", "pid": "chrispedregal", "pod": {"en": "AI & I", "zh": "AI & I"}, "date": "2026-07-15", "min": 60, "fields": ["product", "nlp"], "src": "https://youtu.be/uzYLYlaGAZA", "tEn": "The Knife Fight of AI Startups: Grainola CEO on Thriving Amid Chaos", "tZh": "AI 创业的刀锋之战：Grainola CEO 谈在混乱中蓬勃发展", "addedAt": "2026-07-21T08:39:50Z"}, {"id": "jasonyuan-diveclub-2026", "pid": "jasonyuan", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-07-15", "min": 57, "fields": ["nlp", "product"], "src": "https://youtu.be/qsuqgj4tn0k", "tEn": "From Dot to Hivemind: A Creative Journey in AI Design", "tZh": "从 Dot 到 Hivemind：AI 设计的创意之旅", "addedAt": "2026-07-16T03:16:58Z"}, {"id": "schmidhuber-alexkant-2026", "pid": "schmidhuber", "pod": {"en": "Alex Kantrowitz", "zh": "Alex Kantrowitz"}, "date": "2026-07-15", "min": 60, "fields": ["deep-learning", "product"], "src": "https://youtu.be/i-mRanTY6c4", "tEn": "AI Pioneer on the Future of Intelligence and Self-Replicating Robots", "tZh": "AI 先驱谈智能未来与自我复制机器人", "addedAt": "2026-08-10T01:32:42Z"}, {"id": "katelynlesse-sequoiac-2026", "pid": "katelynlesse", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2026-07-14", "min": 49, "fields": ["nlp", "product"], "src": "https://youtu.be/vPnVTHYplrQ", "tEn": "Anthropic Platform: From Knowledge to Execution to Coordination", "tZh": "Anthropic 平台：从知识到执行再到协调", "addedAt": "2026-07-19T03:25:49Z"}, {"id": "feldman-sourcery-2026", "pid": "feldman", "pod": {"en": "Sourcery with Molly O'Shea", "zh": "Sourcery · 莫莉·奥谢"}, "date": "2026-07-13", "min": 33, "fields": ["deep-learning"], "src": "https://youtu.be/k9UX2fVGhsI", "tEn": "AI Demand Outpaces Expectations: Andrew Feldman on Chips, Deals, and Post-IPO Life", "tZh": "AI 需求超预期：Andrew Feldman 谈芯片、交易和 IPO 后的生活", "addedAt": "2026-07-21T01:25:06Z"}, {"id": "danbiderman-latentsp-2026", "pid": "danbiderman", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2026-07-13", "min": 50, "fields": ["nlp"], "src": "https://youtu.be/jhpmMTus5a0", "tEn": "From Special Forces to AI: Dan Biderman's Journey", "tZh": "从特种部队到 AI：Dan Biderman 的创业之路", "addedAt": "2026-07-19T03:28:06Z"}, {"id": "kokotajlo-thediary-2026", "pid": "kokotajlo", "pod": {"en": "The Diary Of A CEO", "zh": "The Diary Of A CEO"}, "date": "2026-07-13", "min": 121, "fields": ["safety"], "src": "https://youtu.be/_g4l7YkDQwA", "tEn": "AI's Existential Threat and the Race for Superintelligence", "tZh": "AI 的生存威胁与超级智能竞赛", "addedAt": "2026-07-19T03:17:26Z"}, {"id": "pullen-machinel-2026", "pid": "pullen", "pod": {"en": "Machine Learning Street Talk", "zh": "ML Street Talk"}, "date": "2026-07-13", "min": 56, "fields": ["deep-learning"], "src": "https://youtu.be/JTHmrELSfvk", "tEn": "Sovereign AI: Building the UK's First LLM on a Startup Budget", "tZh": "主权 AI：用初创预算打造英国首个大语言模型", "addedAt": "2026-07-14T14:14:13Z"}, {"id": "noamsegal-lennyspo-2026", "pid": "noamsegal", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2026-07-12", "min": 96, "fields": ["product", "nlp"], "src": "https://youtu.be/_cmpIveXnvE", "tEn": "Tech Worker Sentiment Survey: Burnout Rising, Optimism Declining Amid AI Fears", "tZh": "科技从业者心态调查：职业倦怠加剧，AI 引发担忧导致乐观情绪下降", "addedAt": "2026-07-30T03:00:57Z"}, {"id": "davidad-thecogni-2026", "pid": "davidad", "pod": {"en": "The Cognitive Revolution", "zh": "The Cognitive Revolution"}, "date": "2026-07-12", "min": 144, "fields": ["safety"], "src": "https://youtu.be/l2b9UrSsz-w", "tEn": "The Cognitive Revolution: Davidad on Provably Safe AI and the Future of Alignment", "tZh": "认知革命：Davidad 论可证明安全的 AI 与对齐的未来", "addedAt": "2026-07-14T01:40:14Z"}, {"id": "perszyk-latentsp-2026", "pid": "perszyk", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2026-07-11", "min": 49, "fields": ["nlp"], "src": "https://youtu.be/K796MYUgt0k", "tEn": "Human-Aligned AI: Collective Intelligence and the Future of Work", "tZh": "人类对齐的 AI：集体智能与工作的未来", "addedAt": "2026-07-19T03:32:41Z"}, {"id": "arvindjain-20vcwith-2026", "pid": "arvindjain", "pod": {"en": "20VC", "zh": "20VC 创投播客"}, "date": "2026-07-11", "min": 60, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/jX-Uq8JJ_j8", "tEn": "Glean CEO: Enterprises Fear Frontier AI Models Eating Their Lunch", "tZh": "Glean CEO：企业担心前沿 AI 模型会蚕食他们的业务", "addedAt": "2026-07-14T01:37:13Z"}, {"id": "evanspiegel-greatcom-2026", "pid": "evanspiegel", "pod": {"en": "Great Company with Jamie Laing", "zh": "Great Company with Jamie Laing"}, "date": "2026-07-10", "min": 52, "fields": ["deep-learning", "product"], "src": "https://youtu.be/_uWmiVRDLoE", "tEn": "Evan Spiegel on Building Snapchat and Battling Meta", "tZh": "埃文·斯皮格尔谈打造 Snapchat 与对抗 Meta", "addedAt": "2026-08-02T03:09:41Z", "reingestedAt": "2026-08-02T06:29:45Z"}, {"id": "neelnanda-googlede-2026", "pid": "neelnanda", "pod": {"en": "Google DeepMind", "zh": "Google DeepMind"}, "date": "2026-07-10", "min": 53, "fields": ["safety", "deep-learning"], "src": "https://youtu.be/1DtMiRKg-cs", "tEn": "Peering Inside the Black Box of AI", "tZh": "窥探 AI 的黑箱内部", "addedAt": "2026-07-11T14:28:10Z"}, {"id": "adambrown-dwarkesh-2026", "pid": "adambrown", "pod": {"en": "Dwarkesh Podcast", "zh": "Dwarkesh 播客"}, "date": "2026-07-10", "min": 98, "fields": ["product"], "src": "https://youtu.be/QbdbAhaJoCQ", "tEn": "Understanding General Relativity: Einstein's Most Beautiful Idea", "tZh": "理解广义相对论：爱因斯坦最美丽的思想", "addedAt": "2026-08-11T01:32:16Z"}, {"id": "mosseri-lennyspo-2026", "pid": "mosseri", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2026-07-09", "min": 68, "fields": ["deep-learning", "product"], "src": "https://youtu.be/yQ_EWmtfWvQ", "tEn": "Adam Mosseri on AI, Taste, and the Future of Product Teams at Instagram", "tZh": "Adam Mosseri 谈 AI、品味与 Instagram 产品团队的未来", "addedAt": "2026-07-19T03:23:49Z"}, {"id": "dylanpatel-wisdomtr-2026", "pid": "dylanpatel", "pod": {"en": "WisdomTree in Europe", "zh": "WisdomTree欧洲"}, "date": "2026-07-09", "min": 67, "fields": ["deep-learning"], "src": "https://youtu.be/lHnxU9f-rwc", "tEn": "From Forum Poster to AI Infrastructure Analyst: The Story of Semi Analysis", "tZh": "从论坛发帖人到 AI 基础设施分析师：Semi Analysis 的起源故事", "addedAt": "2026-07-14T01:33:24Z"}, {"id": "schmidhuber-unsuperv-2026", "pid": "schmidhuber", "pod": {"en": "Unsupervised Learning", "zh": "Unsupervised Learning"}, "date": "2026-07-09", "min": 51, "fields": ["deep-learning", "robotics"], "src": "https://youtu.be/RKjR8DQ40po", "tEn": "AGI and Physical AI: A Conversation with AI Pioneer Jurgen Schmidhuber", "tZh": "AGI 与物理 AI：与 AI 先驱尤尔根·施密德胡伯的对话", "addedAt": "2026-07-11T14:27:07Z"}, {"id": "akshatbubna-latentsp-2026", "pid": "akshatbubna", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2026-07-08", "min": 59, "fields": ["deep-learning"], "src": "https://youtu.be/UwxxlTNPjWo", "tEn": "From Developer to Agent Experience: The Modal Origin Story", "tZh": "从开发者体验到智能体体验：Modal 的起源故事", "addedAt": "2026-07-19T03:30:19Z"}, {"id": "meaghanchoi-diveclub-2026", "pid": "meaghanchoi", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-07-08", "min": 54, "fields": ["nlp", "product"], "src": "https://youtu.be/jEEbjiC4JE0", "tEn": "Designing Claude Code: A Designer's Journey at Anthropic", "tZh": "设计 Claude Code：Anthropic 设计师的旅程", "addedAt": "2026-07-15T07:01:59Z"}, {"id": "wiltschko-thetwiml-2026", "pid": "wiltschko", "pod": {"en": "The TWIML AI Podcast", "zh": "TWIML AI 播客"}, "date": "2026-07-08", "min": 59, "fields": ["deep-learning"], "src": "https://youtu.be/eAEYPIgKwpI", "tEn": "Giving Computers a Sense of Smell", "tZh": "赋予计算机嗅觉", "addedAt": "2026-07-12T07:18:29Z"}, {"id": "lamismukta-ainative-2026", "pid": "lamismukta", "pod": {"en": "AI Native Dev", "zh": "AI Native Dev"}, "date": "2026-07-07", "min": 58, "fields": ["product", "nlp"], "src": "https://youtu.be/7Ue0yM4J-B8", "tEn": "Claude Tag: Your Proactive Teammate in Slack", "tZh": "Claude Tag：你在 Slack 中的主动队友", "addedAt": "2026-07-20T07:18:53Z"}, {"id": "kellerrinaudocliffto-training-2026", "pid": "kellerrinaudocliffto", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2026-07-07", "min": 55, "fields": ["robotics", "product"], "src": "https://youtu.be/6bGxm8gX41o", "tEn": "From Rwanda to Global Logistics: Zipline's Journey", "tZh": "从卢旺达到全球物流：Zipline 的旅程", "addedAt": "2026-08-09T01:31:02Z"}, {"id": "derya-theopena-2026", "pid": "derya", "pod": {"en": "The OpenAI Podcast", "zh": "OpenAI 播客"}, "date": "2026-07-06", "min": 36, "fields": ["deep-learning", "bio"], "src": "https://youtu.be/4sexN3yE8xg", "tEn": "From Medical School to AI: A Biologist's Journey", "tZh": "从医学院到 AI：一位生物学家的旅程", "addedAt": "2026-07-13T14:47:45Z"}, {"id": "ilya-visionec-2026", "pid": "ilya", "pod": {"en": "Vision Economy", "zh": "视觉经济"}, "date": "2026-07-05", "min": 40, "fields": ["deep-learning", "safety"], "src": "https://youtu.be/G8ggtIOPB2Y", "tEn": "The Architect Who Feared His Creation: Ilya Sutskever's AI Journey", "tZh": "创造者之忧：伊利亚·苏茨克沃的人工智能之旅", "addedAt": "2026-07-23T01:25:48Z"}, {"id": "hasani-thecogni-2026", "pid": "hasani", "pod": {"en": "The Cognitive Revolution", "zh": "The Cognitive Revolution"}, "date": "2026-07-04", "min": 108, "fields": ["deep-learning"], "src": "https://youtu.be/Vvad9lpEy8Q", "tEn": "Liquid AI: Squeezing Maximum Intelligence from Limited Compute", "tZh": "Liquid AI：从有限算力中榨取最大智能", "addedAt": "2026-07-09T06:56:54Z"}, {"id": "andreessen-thea16zp-2026b", "pid": "andreessen", "pod": {"en": "The a16z Podcast", "zh": "a16z 播客"}, "date": "2026-07-03", "min": 42, "fields": ["deep-learning"], "src": "https://youtu.be/XwfUzW32cIA", "tEn": "AI as the New Interface: Global Tech Leadership and National Power", "tZh": "AI 作为新界面：全球科技领导力与国家力量", "addedAt": "2026-07-19T01:36:04Z"}, {"id": "naval-naval-2026b", "pid": "naval", "pod": {"en": "Naval", "zh": "纳瓦尔播客"}, "date": "2026-07-03", "min": 68, "fields": ["deep-learning", "safety"], "src": "https://youtu.be/6m-ZZBCiiEE", "tEn": "AI Scaling Laws and the Future of Intelligence", "tZh": "AI 扩展定律与智能未来", "addedAt": "2026-07-03"}, {"id": "catanzaro-themadpo-2026", "pid": "catanzaro", "pod": {"en": "The MAD Podcast", "zh": "Matt Turck 的 MAD 播客"}, "date": "2026-07-02", "min": 83, "fields": ["deep-learning"], "src": "https://youtu.be/Oojrfdl42LI", "tEn": "Open Source AI: Efficiency, Innovation, and the External Brain", "tZh": "开源 AI：效率、创新与外部大脑", "addedAt": "2026-07-19T03:21:35Z"}, {"id": "andreessen-newyorkp-2026", "pid": "andreessen", "pod": {"en": "New York Post", "zh": "纽约邮报"}, "date": "2026-07-02", "min": 50, "fields": ["deep-learning"], "src": "https://youtu.be/lZ7SLYxFiYs", "tEn": "AI Optimism vs Doom: Marc Andreessen on America's Future", "tZh": "AI 乐观主义与末日论：马克·安德森谈美国未来", "addedAt": "2026-07-15T01:33:33Z"}, {"id": "elon-seancste-2026", "pid": "elon", "pod": {"en": "Sean C. Stephens", "zh": "Sean Stephens"}, "date": "2026-07-02", "min": 36, "fields": ["product"], "src": "https://youtu.be/Jua5vzzKlaU", "tEn": "Elon Musk on Fatherhood, AI, and Minimalism", "tZh": "埃隆·马斯克谈为人父、人工智能与极简主义", "addedAt": "2026-07-06"}, {"id": "boris-claude-2026", "pid": "boris", "pod": {"en": "Claude", "zh": "Claude 官方"}, "date": "2026-07-02", "min": 11, "fields": ["nlp"], "src": "https://youtu.be/MhfnicQVkgY", "tEn": "Claude Tag: Proactive AI That Remembers and Acts Autonomously", "tZh": "Claude Tag：主动记忆并自主行动的 AI", "addedAt": "2026-07-04"}, {"id": "dylanfield-sourcery-2026", "pid": "dylanfield", "pod": {"en": "Sourcery with Molly O'Shea", "zh": "Sourcery · 莫莉·奥谢"}, "date": "2026-07-02", "min": 48, "fields": ["product"], "src": "https://youtu.be/3xfMDWEVQWY", "tEn": "Design Isn't Dead: Figma CEO Dylan Field on Config, Community, and AI", "tZh": "设计未死：Figma CEO Dylan Field 谈 Config 大会、社区与 AI", "addedAt": "2026-08-18T01:33:44Z"}, {"id": "pincus-jamesalt-2026", "pid": "pincus", "pod": {"en": "James Altucher", "zh": "詹姆斯·阿尔图彻"}, "date": "2026-07-01", "min": 78, "fields": ["deep-learning"], "src": "https://youtu.be/lNl4IvnQnUc", "tEn": "Building Failure Machines: The Zynga Way", "tZh": "构建失败机器：Zynga 之道", "addedAt": "2026-07-06"}, {"id": "brockman-alexkant-2026", "pid": "brockman", "pod": {"en": "Alex Kantrowitz", "zh": "Alex Kantrowitz"}, "date": "2026-07-01", "min": 45, "fields": ["nlp", "safety"], "src": "https://youtu.be/VZTmS4B840k", "tEn": "From Super App to Invisible Interface: The Future of AI Agents", "tZh": "从超级应用到无形界面：AI 代理的未来", "addedAt": "2026-07-06"}, {"id": "aravind-powerful-2026", "pid": "aravind", "pod": {"en": "PowerfulJRE", "zh": "乔·罗根体验"}, "date": "2026-07-01", "min": 151, "fields": ["nlp"], "src": "https://youtu.be/fOLu-pWQssQ", "tEn": "Ancient Hindu Weapons: The Brahmastra and Autonomous Arms in the Mahabharata", "tZh": "古代印度武器：《摩诃婆罗多》中的梵天法宝与自主武器", "addedAt": "2026-07-04"}, {"id": "mengto-diveclub-2026", "pid": "mengto", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-06-30", "min": 36, "fields": ["product"], "src": "https://youtu.be/SznrOQYiahg", "tEn": "AI Slop and the Evolution of Design Tools", "tZh": "AI 垃圾与设计工具的进化", "addedAt": "2026-07-21T08:32:33Z"}, {"id": "edunov-latentsp-2026", "pid": "edunov", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2026-06-30", "min": 109, "fields": ["deep-learning", "bio"], "src": "https://youtu.be/YQWXxnkK4dw", "tEn": "From GANs to Diffusion: AI's Evolution in Protein Modeling", "tZh": "从 GAN 到扩散：AI 在蛋白质建模中的演变", "addedAt": "2026-07-12T03:55:19Z"}, {"id": "grantsanderson-dwarkesh-2026", "pid": "grantsanderson", "pod": {"en": "Dwarkesh Podcast", "zh": "Dwarkesh 播客"}, "date": "2026-06-30", "min": 94, "fields": ["deep-learning"], "src": "https://youtu.be/TfyPshgMbug", "tEn": "AI in Math: From IMO to Millennium Problems", "tZh": "AI 在数学中的进展：从国际数学奥林匹克到千禧年难题", "addedAt": "2026-07-09T06:58:37Z"}, {"id": "dylanpatel-sequoiac-2026", "pid": "dylanpatel", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2026-06-30", "min": 70, "fields": ["deep-learning"], "src": "https://youtu.be/f6D_aiy8qyU", "tEn": "From Motel to Semi Analysis: Dylan Patel's Journey", "tZh": "从汽车旅馆到半导体分析：Dylan Patel 的创业之路", "addedAt": "2026-07-08T01:35:20Z"}, {"id": "hinton-mitimes-2026", "pid": "hinton", "pod": {"en": "MIT IMES", "zh": "MIT IMES"}, "date": "2026-06-30", "min": 78, "fields": ["safety", "deep-learning"], "src": "https://youtu.be/g6AwGpfE2b0", "tEn": "Geoffrey Hinton on AI Dangers and the Two Paradigms of Intelligence", "tZh": "Geoffrey Hinton 谈 AI 危险与智能的两种范式", "addedAt": "2026-07-05"}, {"id": "ajambrosino-lennyspo-2026", "pid": "ajambrosino", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2026-06-28", "min": 70, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/P3KDebPTUrw", "tEn": "AI Is Inverting Product Teams: Andrew Ambrosino on Codex", "tZh": "AI 正在颠覆产品团队：Andrew Ambrosino 谈 Codex", "addedAt": "2026-07-03"}, {"id": "thomasahle-machinel-2026", "pid": "thomasahle", "pod": {"en": "Machine Learning Street Talk", "zh": "ML Street Talk"}, "date": "2026-06-28", "min": 63, "fields": ["deep-learning"], "src": "https://youtu.be/5pieVHmlbyk", "tEn": "Building Randomness: Thermodynamic Computing and AI-Driven Chip Design", "tZh": "构建随机性：热力学计算与 AI 驱动的芯片设计", "addedAt": "2026-08-07T03:14:40Z"}, {"id": "zuckerberg-complex-2026", "pid": "zuckerberg", "pod": {"en": "Complex", "zh": "复杂"}, "date": "2026-06-26", "min": 44, "fields": ["product"], "src": "https://youtu.be/u-vH31VD7GE", "tEn": "Meta's AI Glasses: The Next Computing Platform", "tZh": "Meta AI 眼镜：下一代计算平台", "addedAt": "2026-07-15T01:34:41Z"}, {"id": "noambrown-nopriors-2026", "pid": "noambrown", "pod": {"en": "No Priors", "zh": "No Priors 播客"}, "date": "2026-06-26", "min": 36, "fields": ["rl", "safety"], "src": "https://youtu.be/AZrU6y3pUcU", "tEn": "Large-Scale Test Time Compute and Model Evaluation", "tZh": "大规模测试时计算与模型评估", "addedAt": "2026-07-01"}, {"id": "pincus-ycombina-2026", "pid": "pincus", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2026-06-25", "min": 41, "fields": ["deep-learning"], "src": "https://youtu.be/oHwUD9b9_pg", "tEn": "Building Products People Love: A Playbook for the AI Era", "tZh": "打造人们喜爱的产品：AI 时代的行动指南", "addedAt": "2026-07-06"}, {"id": "markchen-latentsp-2026", "pid": "markchen", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2026-06-25", "min": 41, "fields": ["deep-learning", "nlp"], "src": "https://youtu.be/fpAthTtha8c", "tEn": "From Trading to AGI: Mark Chen on Research Taste and Replication", "tZh": "从交易员到 AGI：Mark Chen 谈研究品味与复现", "addedAt": "2026-07-05"}, {"id": "bengio-sineadbo-2026", "pid": "bengio", "pod": {"en": "Sinead Bovell", "zh": "Sinead Bovell"}, "date": "2026-06-25", "min": 72, "fields": ["deep-learning", "safety"], "src": "https://youtu.be/4A43Y2fNtZo", "tEn": "AI's Power Thirst: Blackmail, Self-Preservation, and What We Can Do", "tZh": "AI 的权力欲望：勒索、自我保存与应对之道", "addedAt": "2026-07-04"}, {"id": "mikekrieger-alexkant-2026", "pid": "mikekrieger", "pod": {"en": "Alex Kantrowitz", "zh": "Alex Kantrowitz"}, "date": "2026-06-25", "min": 41, "fields": ["product", "nlp"], "src": "https://youtu.be/eAPyqzAAeWU", "tEn": "Anthropic Labs: Inside the Frontier of AI Products", "tZh": "Anthropic Labs：AI 产品前沿探秘", "addedAt": "2026-08-07T01:35:26Z"}, {"id": "loredanacrisan-diveclub-2026", "pid": "loredanacrisan", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-06-24", "min": 50, "fields": ["nlp", "product"], "src": "https://youtu.be/z7A0R9fwixg", "tEn": "Putting Soul into AI Design: Figma's CDO on Music, Intuition, and the Future", "tZh": "将灵魂注入 AI 设计：Figma 首席设计官谈音乐、直觉与未来", "addedAt": "2026-07-17T09:18:35Z"}, {"id": "benedictevans-analysep-2026", "pid": "benedictevans", "pod": {"en": "Analyse Podcast", "zh": "分析播客"}, "date": "2026-06-24", "min": 58, "fields": ["deep-learning"], "src": "https://youtu.be/2HDYlKxM-Hw", "tEn": "AI Models Commoditization and Public Market Test", "tZh": "AI 模型商品化与公开市场考验", "addedAt": "2026-07-15T01:36:06Z"}, {"id": "matei-latentsp-2026", "pid": "matei", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2026-06-24", "min": 70, "fields": ["deep-learning"], "src": "https://youtu.be/Yp_u1NpbkJg", "tEn": "Omnigents: The Meta Harness for AI Agents", "tZh": "Omnigents：AI 智能体的元框架", "addedAt": "2026-07-14T01:49:45Z"}, {"id": "danbiderman-training-2026", "pid": "danbiderman", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2026-06-24", "min": 45, "fields": ["deep-learning"], "src": "https://youtu.be/aiR7F4jqjXY", "tEn": "Memory and Continual Learning: The Next Frontier in AI", "tZh": "记忆与持续学习：AI 的下一个前沿", "addedAt": "2026-07-09T07:00:41Z"}, {"id": "demis-semafort-2026", "pid": "demis", "pod": {"en": "Semafor Tech", "zh": "Semafor Tech"}, "date": "2026-06-24", "min": 29, "fields": ["deep-learning", "safety"], "src": "https://youtu.be/hb9JPW_DkpQ", "tEn": "Demis Hassabis on AGI, AI Risks, and DeepMind's Competitive Edge", "tZh": "Demis Hassabis 谈 AGI、AI 风险与 DeepMind 的竞争优势", "addedAt": "2026-07-02"}, {"id": "brettaylor-clickhou-2026", "pid": "brettaylor", "pod": {"en": "ClickHouse", "zh": "ClickHouse"}, "date": "2026-06-24", "min": 44, "fields": ["product"], "src": "https://youtu.be/ZtvlCz7Ukg4", "tEn": "Balancing AI Leadership: Bret Taylor on OpenAI, Sierra, and Life", "tZh": "平衡 AI 领导力：布雷特·泰勒谈 OpenAI、Sierra 与生活", "addedAt": "2026-08-21T01:32:18Z"}, {"id": "joonpark-googlede-2026", "pid": "joonpark", "pod": {"en": "Google DeepMind", "zh": "Google DeepMind"}, "date": "2026-06-23", "min": 43, "fields": ["deep-learning"], "src": "https://youtu.be/V04bm-3d6EQ", "tEn": "AI Agents: The Next Frontier Beyond LLMs", "tZh": "AI 智能体：超越大语言模型的下一个前沿", "addedAt": "2026-07-10T01:30:47Z"}, {"id": "steinberger-ainewspo-2026", "pid": "steinberger", "pod": {"en": "AI News & Podcast", "zh": "AI 新闻与播客"}, "date": "2026-06-22", "min": 196, "fields": ["nlp"], "src": "https://youtu.be/yK_c95TfUxQ", "tEn": "The OpenClaw Moment: AI Agent Revolution with Peter Steinberger", "tZh": "OpenClaw 时刻：与 Peter Steinberger 的 AI 代理革命", "addedAt": "2026-07-13T01:31:24Z"}, {"id": "kolter-latentsp-2026", "pid": "kolter", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2026-06-22", "min": 68, "fields": ["safety"], "src": "https://youtu.be/j8BAficRjEc", "tEn": "AI Red Teaming Outperforms Humans", "tZh": "AI 红队测试超越人类", "addedAt": "2026-07-05"}, {"id": "jumper-machinel-2026", "pid": "jumper", "pod": {"en": "Machine Learning Street Talk", "zh": "ML Street Talk"}, "date": "2026-06-22", "min": 53, "fields": ["deep-learning", "bio"], "src": "https://youtu.be/e3gBwLWAerw", "tEn": "AlphaFold: AI's Nobel-Winning Leap in Protein Folding", "tZh": "AlphaFold：AI 在蛋白质折叠领域的诺贝尔奖级突破", "addedAt": "2026-06-27"}, {"id": "qasaryounis-lemonade-2026", "pid": "qasaryounis", "pod": {"en": "Lemonade Stand Clips", "zh": "柠檬水摊剪辑"}, "date": "2026-06-21", "min": 49, "fields": ["robotics"], "src": "https://youtu.be/tMzQX1I3X1M", "tEn": "Autonomous Vehicles: From Tesla to Waymo and Beyond", "tZh": "自动驾驶：从特斯拉到 Waymo 及更远", "addedAt": "2026-07-15T01:37:16Z"}, {"id": "fiona-lennyspo-2026", "pid": "fiona", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2026-06-21", "min": 99, "fields": ["nlp"], "src": "https://youtu.be/Ybrl4FYM57c", "tEn": "Fiona Fung on AI's Impact on Software Engineering", "tZh": "Fiona Fung 谈 AI 对软件工程的影响", "addedAt": "2026-06-27"}, {"id": "deanball-thecogni-2026", "pid": "deanball", "pod": {"en": "The Cognitive Revolution", "zh": "The Cognitive Revolution"}, "date": "2026-06-20", "min": 159, "fields": ["safety"], "src": "https://youtu.be/LG8KXIv0_mA", "tEn": "Dean Ball on Joining OpenAI, AI Policy, and Recursive Self-Improvement", "tZh": "迪恩·鲍尔谈加入 OpenAI、AI 政策与递归自我改进", "addedAt": "2026-07-14T14:09:25Z"}, {"id": "andreessen-thea16zp-2026", "pid": "andreessen", "pod": {"en": "The a16z Podcast", "zh": "a16z 播客"}, "date": "2026-06-19", "min": 42, "fields": ["deep-learning"], "src": "https://youtu.be/XROaLetSxg0", "tEn": "New Media vs Old Media: Authenticity and the Death of Media Training", "tZh": "新媒体 vs 旧媒体：真实性与媒体培训的消亡", "addedAt": "2026-07-15T01:38:22Z"}, {"id": "feifei-siliconv-2026", "pid": "feifei", "pod": {"en": "Silicon Valley Girl", "zh": "硅谷女孩"}, "date": "2026-06-19", "min": 49, "fields": ["deep-learning"], "src": "https://youtu.be/subu-xHrp1w", "tEn": "AI's Future and Yours: Agency, Tools, and the Widening Gap", "tZh": "AI 的未来与你：自主性、工具与日益扩大的鸿沟", "addedAt": "2026-07-04"}, {"id": "boris-scale-2026", "pid": "boris", "pod": {"en": "@Scale", "zh": "Scale AI"}, "date": "2026-06-19", "min": 41, "fields": ["nlp"], "src": "https://youtu.be/Z47vatpsGPI", "tEn": "AI Coding on Phone: Boris on 8B Tokens & ROI", "tZh": "手机写代码？Boris 谈 80 亿 Token 与 AI 投资回报率", "addedAt": "2026-06-22"}, {"id": "lipbutan-nopriors-2026", "pid": "lipbutan", "pod": {"en": "No Priors", "zh": "No Priors 播客"}, "date": "2026-06-18", "min": 45, "fields": ["deep-learning"], "src": "https://youtu.be/asCgCv2XB4s", "tEn": "Lip-Bu Tan on Saving Intel: Culture, Customers, and the CPU Comeback", "tZh": "陈立武谈拯救英特尔：文化、客户与 CPU 复兴", "addedAt": "2026-07-20T01:31:24Z"}, {"id": "andrewng-langchai-2026", "pid": "andrewng", "pod": {"en": "LangChain Interrupt", "zh": "LangChain Interrupt 智能体大会"}, "date": "2026-06-17", "min": 32, "fields": ["deep-learning", "nlp"], "src": "https://youtu.be/OaRhpwz_TGM", "tEn": "AI Coding Agents and the Product Management Bottleneck", "tZh": "AI 编程代理与产品管理瓶颈", "addedAt": "2026-07-02"}, {"id": "dario-bloomber-2026", "pid": "dario", "pod": {"en": "Bloomberg Originals", "zh": "彭博原创"}, "date": "2026-06-17", "min": 70, "fields": ["nlp", "safety"], "src": "https://youtu.be/x2VHFgyawPE", "tEn": "Inside the AI Revolution: Sleep, Stress, and Scaling", "tZh": "AI 革命内幕：睡眠、压力与规模扩张", "addedAt": "2026-06-20"}, {"id": "brettwilliams-diveclub-2026", "pid": "brettwilliams", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-06-16", "min": 50, "fields": ["product"], "src": "https://youtu.be/Xxiq2phvwOA", "tEn": "From Skeptic to Builder: A Designer's Leap into AI", "tZh": "从怀疑到创造：设计师的 AI 跃迁", "addedAt": "2026-08-01T09:56:48Z", "reingestedAt": "2026-08-02T07:34:41Z"}, {"id": "danklein-gradient-2026", "pid": "danklein", "pod": {"en": "Gradient Dissent", "zh": "Gradient Dissent"}, "date": "2026-06-16", "min": 75, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/JzETCk92Izw", "tEn": "AI's Plausibility Problem: From Exponential Hype to Diminishing Returns", "tZh": "AI 的可信度危机：从指数级炒作到收益递减", "addedAt": "2026-07-14T15:05:30Z"}, {"id": "joonpark-training-2026", "pid": "joonpark", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2026-06-16", "min": 39, "fields": ["deep-learning"], "src": "https://youtu.be/lfhFmwcESRw", "tEn": "Simulating Human Societies with AI: From Smallville to Real-World Applications", "tZh": "用 AI 模拟人类社会：从小镇实验到现实应用", "addedAt": "2026-07-09T06:55:24Z"}, {"id": "ethanmollick-simonsin-2026", "pid": "ethanmollick", "pod": {"en": "Simon Sinek", "zh": "西蒙·斯涅克"}, "date": "2026-06-16", "min": 59, "fields": ["deep-learning"], "src": "https://youtu.be/9YMYVb1ASCg", "tEn": "How to Stand Out in an AI-Driven Job Market", "tZh": "在 AI 驱动的就业市场中如何脱颖而出", "addedAt": "2026-07-08T01:36:42Z"}, {"id": "tejal-theopena-2026", "pid": "tejal", "pod": {"en": "The OpenAI Podcast", "zh": "OpenAI 播客"}, "date": "2026-06-16", "min": 44, "fields": ["deep-learning", "safety"], "src": "https://youtu.be/CFqjjKp9Y-Q", "tEn": "Building Crunchier Evals: Tejal Patwardhan on Measuring AI Progress", "tZh": "构建更严格的评估：Tejal Patwardhan 谈衡量 AI 进展", "addedAt": "2026-07-05"}, {"id": "jensen-associat-2026", "pid": "jensen", "pod": {"en": "Associated Press", "zh": "美联社"}, "date": "2026-06-16", "min": 52, "fields": ["deep-learning", "product"], "src": "https://youtu.be/VU8vRGWMOy4", "tEn": "AI Factory Groundbreaking: Smarter, Safer, and Reindustrializing the US", "tZh": "AI 工厂奠基：更智能、更安全，助力美国再工业化", "addedAt": "2026-06-20"}, {"id": "mattwhite-finovers-2026", "pid": "mattwhite", "pod": {"en": "Finoverse", "zh": "Finoverse"}, "date": "2026-06-15", "min": 85, "fields": ["deep-learning"], "src": "https://youtu.be/zHi0jy4MK4c", "tEn": "AI CTO at Linux Foundation on Open Source AI, China's Rise, and Agentic AI", "tZh": "Linux 基金会 AI CTO 谈开源 AI、中国崛起与智能体 AI", "addedAt": "2026-07-07T00:00:00Z"}, {"id": "aravind-20vcwith-2026", "pid": "aravind", "pod": {"en": "20VC", "zh": "20VC 创投播客"}, "date": "2026-06-15", "min": 95, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/OxFyVcO1Yow", "tEn": "Perplexity CEO: Attack, Attack, Attack", "tZh": "Perplexity CEO：进攻，进攻，进攻", "addedAt": "2026-07-01"}, {"id": "pincus-lennyspo-2026", "pid": "pincus", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2026-06-14", "min": 99, "fields": ["deep-learning"], "src": "https://youtu.be/7eh9C3TUotc", "tEn": "Mark Pincus on Proven Better New: A Framework for Successful Product Ideas", "tZh": "马克·平卡斯谈“已验证更好新”：成功产品创意的框架", "addedAt": "2026-07-05"}, {"id": "arimorcos-unsuperv-2026", "pid": "arimorcos", "pod": {"en": "Unsupervised Learning", "zh": "Unsupervised Learning"}, "date": "2026-06-12", "min": 67, "fields": ["nlp", "product"], "src": "https://youtu.be/W_iO8XxgD_I", "tEn": "AI Vibe Check: Coding Agents, Open-Weight AI, and the Compute Crunch", "tZh": "AI 氛围检查：编程代理、开放权重 AI 与算力紧张", "addedAt": "2026-08-19T01:32:36Z"}, {"id": "fadell-giantide-2026", "pid": "fadell", "pod": {"en": "Giant Ideas", "zh": "Giant Ideas"}, "date": "2026-06-11", "min": 36, "fields": ["deep-learning", "product"], "src": "https://youtu.be/LnrhvMT2r84", "tEn": "The Untold Gamble Behind the iPod: Apple's Last Stand", "tZh": "iPod 背后不为人知的豪赌：苹果的背水一战", "addedAt": "2026-08-02T03:15:44Z", "reingestedAt": "2026-08-02T06:24:25Z"}, {"id": "logankilpatrick-training-2026", "pid": "logankilpatrick", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2026-06-11", "min": 51, "fields": ["deep-learning"], "src": "https://youtu.be/cMAs8z2dehs", "tEn": "Agentic AI Era: Google's Anti-Gravity Harness Powers Next-Gen Products", "tZh": "智能体 AI 时代：谷歌反重力引擎驱动下一代产品", "addedAt": "2026-07-09T06:59:37Z"}, {"id": "mikekrieger-aii-2026", "pid": "mikekrieger", "pod": {"en": "AI & I", "zh": "AI & I"}, "date": "2026-06-10", "min": 52, "fields": ["product", "nlp"], "src": "https://youtu.be/XWpTgCvgYaE", "tEn": "Fable 5: From First Impressions to Real Workflows", "tZh": "Fable 5：从第一印象到实际工作流", "addedAt": "2026-07-20T07:23:09Z"}, {"id": "zuckerberg-nopriors-2026", "pid": "zuckerberg", "pod": {"en": "No Priors", "zh": "No Priors 播客"}, "date": "2026-06-10", "min": 56, "fields": ["deep-learning", "bio"], "src": "https://youtu.be/u8cYwaLzN-k", "tEn": "Accelerating Biology with AI: Mark Zuckerberg, Priscilla Chan, and Alex Rives on Biohub", "tZh": "用 AI 加速生物学：马克·扎克伯格、普莉希拉·陈和亚历克斯·里夫斯谈 Biohub", "addedAt": "2026-07-14T01:20:07Z"}, {"id": "dario-thecircu-2026", "pid": "dario", "pod": {"en": "The Circuit (Bloomberg)", "zh": "The Circuit 彭博"}, "date": "2026-06-10", "min": 48, "fields": ["safety", "deep-learning"], "src": "https://youtu.be/v1wZwxY3CMg", "tEn": "Anthropic: The AI Siblings Building Responsible Superintelligence", "tZh": "Anthropic：打造负责任超级智能的 AI 兄妹", "addedAt": "2026-07-01"}, {"id": "jensen-training", "pid": "jensen", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2026-06-10", "min": 41, "fields": ["deep-learning"], "src": "https://youtu.be/2UpQbeAZuqA", "tEn": "Building the dynamo of the intelligence revolution", "tZh": "打造智能革命的「发电机」", "addedAt": "2026-06-17"}, {"id": "ivyross-futurelo-2026", "pid": "ivyross", "pod": {"en": "Future London Academy", "zh": "Future London Academy"}, "date": "2026-06-10", "min": 76, "fields": ["product"], "src": "https://youtu.be/_Dg4tRQFSAo", "tEn": "Designing a Life: Ivy Ross on Curiosity, Craft, and Leading at Google", "tZh": "设计人生：Ivy Ross 谈好奇心、工艺与谷歌领导力", "addedAt": "2026-08-14T09:19:51Z"}, {"id": "rongoldin-diveclub-2026", "pid": "rongoldin", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-06-09", "min": 54, "fields": ["product"], "src": "https://youtu.be/UkQpgslyR3A", "tEn": "Designers Have a Superpower: Empathy in the AI Era", "tZh": "设计师的超级力量：AI 时代中的同理心", "addedAt": "2026-08-01T09:15:55Z", "reingestedAt": "2026-08-02T06:43:55Z"}, {"id": "lecun-computer-2026", "pid": "lecun", "pod": {"en": "Computer Vision and Geometry Group, ETH Zurich", "zh": "苏黎世联邦理工学院计算机视觉与几何组"}, "date": "2026-06-09", "min": 59, "fields": ["deep-learning"], "src": "https://youtu.be/72Xj8k5WQX4", "tEn": "World Models: Enabler for the Next AR Revolution", "tZh": "世界模型：下一场 AR 革命的推动力", "addedAt": "2026-06-17"}, {"id": "benedictevans-thea16zp-2026", "pid": "benedictevans", "pod": {"en": "The a16z Podcast", "zh": "a16z 播客"}, "date": "2026-06-08", "min": 61, "fields": ["deep-learning"], "src": "https://youtu.be/ktl8mNiWqMM", "tEn": "Agentic Coding: From Useful to Game-Changing", "tZh": "智能体编程：从有用到颠覆一切", "addedAt": "2026-07-15T01:39:29Z"}, {"id": "suleyman-decoder", "pid": "suleyman", "pod": {"en": "Decoder", "zh": "Decoder"}, "date": "2026-06-08", "min": 72, "fields": ["nlp", "safety"], "src": "https://youtu.be/Z4bwAjR7azM", "tEn": "Superintelligence is near — but make it humanist", "tZh": "超级智能将至——但要「以人为本」", "addedAt": "2026-06-17"}, {"id": "fadell-lennyspo-2026", "pid": "fadell", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2026-06-07", "min": 95, "fields": ["deep-learning", "product"], "src": "https://youtu.be/RJjl1TwyfWM", "tEn": "Tony Fadell on Building the iPhone and the Importance of Storytelling", "tZh": "托尼·法德尔谈 iPhone 的构建与讲故事的重要性", "addedAt": "2026-07-14T13:59:12Z"}, {"id": "demis-nobelpri-2026", "pid": "demis", "pod": {"en": "Nobel Prize", "zh": "诺贝尔奖官方"}, "date": "2026-06-07", "min": 67, "fields": ["deep-learning"], "src": "https://youtu.be/N8LEewvzmUA", "tEn": "Science at Digital Speed: AI's Impact on Discovery", "tZh": "数字速度下的科学：AI 对发现的影响", "addedAt": "2026-07-05"}, {"id": "gustav-founders-2026", "pid": "gustav", "pod": {"en": "Founders", "zh": "Founders"}, "date": "2026-06-07", "min": 74, "fields": ["product", "nlp"], "src": "https://youtu.be/qYnVDIgZxlI", "tEn": "From Co-President to CEO: Inside Spotify's Unusual Succession", "tZh": "从联席总裁到 CEO：Spotify 非同寻常的接班内幕", "addedAt": "2026-08-09T04:19:19Z"}, {"id": "satya-reidhoff-2026", "pid": "satya", "pod": {"en": "Reid Hoffman", "zh": "雷德·霍夫曼"}, "date": "2026-06-05", "min": 60, "fields": ["deep-learning"], "src": "https://youtu.be/BKx0Dp8y-6g", "tEn": "Satya Nadella: AI as the Hill-Climbing Machine", "tZh": "萨提亚·纳德拉：AI 作为爬山机器", "addedAt": "2026-07-16T01:30:57Z"}, {"id": "awang-bloomber-2026", "pid": "awang", "pod": {"en": "Bloomberg Live", "zh": "彭博 Live"}, "date": "2026-06-05", "min": 20, "fields": ["deep-learning", "nlp"], "src": "https://youtu.be/bO06SaZdnXs", "tEn": "Meta's AI Journey: From Llama 4 to Muse Spark and Beyond", "tZh": "Meta 的 AI 之旅：从 Llama 4 到 Muse Spark 及未来", "addedAt": "2026-07-02"}, {"id": "satya-nopriors-2026", "pid": "satya", "pod": {"en": "No Priors", "zh": "No Priors 播客"}, "date": "2026-06-04", "min": 42, "fields": ["deep-learning"], "src": "https://youtu.be/RQE8OS392dU", "tEn": "Satya Nadella on AI Ecosystem Strategy and Frontier Models", "tZh": "萨提亚·纳德拉谈 AI 生态系统战略与前沿模型", "addedAt": "2026-07-14T01:21:03Z"}, {"id": "noambrown-baincapi-2026", "pid": "noambrown", "pod": {"en": "Bain Capital Ventures", "zh": "Bain Capital Ventures"}, "date": "2026-06-04", "min": 44, "fields": ["rl", "deep-learning"], "src": "https://youtu.be/h4ZguzEMKAU", "tEn": "AI Surpasses Human Understanding in Math: OpenAI's Noam Brown on the Erdős Conjecture Disproof", "tZh": "AI 在数学上超越人类理解：OpenAI 的 Noam Brown 谈 Erdős 猜想的推翻", "addedAt": "2026-07-05"}, {"id": "alexwei-theopena-2026", "pid": "alexwei", "pod": {"en": "The OpenAI Podcast", "zh": "OpenAI 播客"}, "date": "2026-06-04", "min": 41, "fields": ["deep-learning", "rl"], "src": "https://youtu.be/wNWz5Hbh5VQ", "tEn": "OpenAI's Math Breakthrough: The Story Behind the Discovery", "tZh": "OpenAI 数学突破：发现背后的故事", "addedAt": "2026-07-04"}, {"id": "murati-bloomber", "pid": "murati", "pod": {"en": "Bloomberg Live", "zh": "彭博直播"}, "date": "2026-06-04", "min": 28, "fields": ["nlp"], "src": "https://youtu.be/A_jIpryR5js", "tEn": "Thinking Machines on AI’s next chapter", "tZh": "Thinking Machines 谈 AI 的下一章", "addedAt": "2026-06-17"}, {"id": "hinton-alexkant-2026", "pid": "hinton", "pod": {"en": "Alex Kantrowitz", "zh": "Alex Kantrowitz"}, "date": "2026-06-04", "min": 55, "fields": ["deep-learning", "safety"], "src": "https://youtu.be/p7t1Q_p2gZs", "tEn": "AI Godfather Jeff Hinton on AI's Trajectory, Risks, and Superintelligence", "tZh": "AI 教父杰夫·辛顿谈 AI 轨迹、风险与超级智能", "addedAt": "2026-06-17"}, {"id": "rasmusandersson-southpar-2026", "pid": "rasmusandersson", "pod": {"en": "South Park Commons", "zh": "South Park Commons"}, "date": "2026-06-04", "min": 42, "fields": ["product"], "src": "https://youtu.be/kPqH3ZSbVjo", "tEn": "From Spotify to Playbit: Rasmus Andersson on Design, Engineering, and Building an OS", "tZh": "从 Spotify 到 Playbit：Rasmus Andersson 谈设计、工程与构建操作系统", "addedAt": "2026-08-12T07:59:03Z"}, {"id": "carinahong-latentsp-2026", "pid": "carinahong", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2026-06-03", "min": 93, "fields": ["deep-learning"], "src": "https://youtu.be/abYcV5LHMG4", "tEn": "Verified AI: Scaling Brilliance Through Formal Verification", "tZh": "验证式 AI：通过形式验证扩展智慧", "addedAt": "2026-07-16T01:32:36Z"}, {"id": "alibehrouz-thecogni-2026", "pid": "alibehrouz", "pod": {"en": "The Cognitive Revolution", "zh": "The Cognitive Revolution"}, "date": "2026-06-03", "min": 180, "fields": ["deep-learning"], "src": "https://youtu.be/bBvfozmEAGw", "tEn": "Nested Learning & AI Sleep: Towards Continual Learning with Ali Behrouz", "tZh": "嵌套学习与 AI 睡眠：与 Ali Behrouz 探讨持续学习", "addedAt": "2026-07-07T00:07:00Z"}, {"id": "kaiser-unsuperv-2026", "pid": "kaiser", "pod": {"en": "Unsupervised Learning", "zh": "Unsupervised Learning"}, "date": "2026-06-03", "min": 74, "fields": ["deep-learning", "nlp"], "src": "https://youtu.be/N1geOimmdDo", "tEn": "Is Reasoning Enough for Generalization?", "tZh": "推理足以实现泛化吗？", "addedAt": "2026-07-07T00:03:00Z"}, {"id": "mensch-cnbc-2026", "pid": "mensch", "pod": {"en": "CNBC", "zh": "CNBC"}, "date": "2026-06-03", "min": 46, "fields": ["nlp"], "src": "https://youtu.be/325gGv0eWV8", "tEn": "Mistral CEO on Building European AI Infrastructure", "tZh": "Mistral CEO 谈构建欧洲 AI 基础设施", "addedAt": "2026-06-17"}, {"id": "rohinshah-80000hou-2026", "pid": "rohinshah", "pod": {"en": "80,000 Hours", "zh": "80,000 小时"}, "date": "2026-06-02", "min": 168, "fields": ["safety"], "src": "https://youtu.be/Tv3mGA3wqh8", "tEn": "Why AI Alignment Might Not Be Catastrophic: Rohan Sha's Optimistic Take", "tZh": "AI 对齐可能并非灾难：Rohan Sha 的乐观观点", "addedAt": "2026-07-05"}, {"id": "boris-acquired-2026", "pid": "boris", "pod": {"en": "Acquired Unplugged (presented by WorkOS)", "zh": "Acquired Unplugged （WorkOS 呈现）"}, "date": "2026-06-02", "min": 30, "fields": ["deep-learning", "nlp"], "src": "https://youtu.be/RkQQ7WEor7w", "tEn": "The Origin of Claude Code: From Accident to Agent", "tZh": "Claude Code 的起源：从意外到智能代理", "addedAt": "2026-07-02"}, {"id": "demis-stanford-2026", "pid": "demis", "pod": {"en": "Stanford Graduate School of Business", "zh": "斯坦福商学院"}, "date": "2026-06-02", "min": 57, "fields": ["deep-learning"], "src": "https://youtu.be/DsewHeVbL-0", "tEn": "Dennis Hassabis on AI, Creativity, and Human Flourishing at Stanford", "tZh": "丹尼斯·哈萨比斯在斯坦福谈人工智能、创造力与人类繁荣", "addedAt": "2026-06-17"}, {"id": "ethanhe-latentsp-2026", "pid": "ethanhe", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2026-06-01", "min": 105, "fields": ["deep-learning"], "src": "https://youtu.be/jPtQlILfkhA", "tEn": "Visual Intelligence Comes from Language Models", "tZh": "视觉智能主要来自语言模型", "addedAt": "2026-07-07T00:06:00Z"}, {"id": "demis-unsuperv-2026", "pid": "demis", "pod": {"en": "Unsupervised Learning", "zh": "Unsupervised Learning"}, "date": "2026-06-01", "min": 56, "fields": ["deep-learning", "rl"], "src": "https://youtu.be/WC_embCiwgU", "tEn": "Demis Hassabis: From Singleton Dream to Collective Action", "tZh": "Demis Hassabis：从单一梦想走向集体行动", "addedAt": "2026-07-06"}, {"id": "naval-naval-2026", "pid": "naval", "pod": {"en": "Naval", "zh": "纳瓦尔播客"}, "date": "2026-06-01", "min": 70, "fields": ["deep-learning"], "src": "https://youtu.be/v6MWNrVbM4E", "tEn": "Naval Podcast: Building Factories for AI, Supersonic Jets, and Brain Interfaces", "tZh": "Naval 播客：构建 AI 工厂、超音速喷气机和脑机接口", "addedAt": "2026-07-03"}, {"id": "benedictevans-lennyspo-2026", "pid": "benedictevans", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2026-05-31", "min": 80, "fields": ["deep-learning"], "src": "https://youtu.be/BD3vLtWhT5A", "tEn": "AI Is as Big as the Internet or Mobile", "tZh": "AI 与互联网或移动技术同等重要", "addedAt": "2026-07-14T14:04:14Z"}, {"id": "jensen-cna-2026", "pid": "jensen", "pod": {"en": "CNA", "zh": "CNA"}, "date": "2026-05-29", "min": 56, "fields": ["deep-learning"], "src": "https://youtu.be/XVoyL8rzhWs", "tEn": "Jensen Huang on AI Revolution: From Chips to Agentic AI", "tZh": "黄仁勋谈 AI 革命：从芯片到智能体 AI", "addedAt": "2026-07-07T00:12:00Z"}, {"id": "waldenyan-latentsp-2026", "pid": "waldenyan", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2026-05-28", "min": 70, "fields": ["nlp", "product"], "src": "https://youtu.be/0fgJPhYcbVk", "tEn": "AI Testing: Beyond Computer Use to Autonomous Agents", "tZh": "AI 测试：超越计算机使用，迈向自主代理", "addedAt": "2026-07-12T03:57:27Z"}, {"id": "rodriques-gradient-2026", "pid": "rodriques", "pod": {"en": "Gradient Dissent", "zh": "Gradient Dissent"}, "date": "2026-05-27", "min": 75, "fields": ["deep-learning", "bio"], "src": "https://youtu.be/Q7NpRG2gAxc", "tEn": "AI Scientist: The Future of Drug Discovery", "tZh": "AI 科学家：药物发现的未来", "addedAt": "2026-07-14T15:07:41Z"}, {"id": "alexrives-latentsp-2026", "pid": "alexrives", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2026-05-27", "min": 70, "fields": ["deep-learning", "bio"], "src": "https://youtu.be/XdevS0GSuiQ", "tEn": "ESMC: World Modeling for Protein Design", "tZh": "ESMC：蛋白质设计的世界建模方法", "addedAt": "2026-07-07T00:10:00Z"}, {"id": "andymadrick-diveclub-2026", "pid": "andymadrick", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-05-26", "min": 53, "fields": ["product"], "src": "https://youtu.be/IfPK0LwbX_0", "tEn": "AI Collaboration in Design: From Figma to Code at Notion", "tZh": "AI 协作设计：从 Figma 到代码的 Notion 实践", "addedAt": "2026-07-21T15:05:10Z"}, {"id": "feldman-bloomber-2026", "pid": "feldman", "pod": {"en": "Bloomberg Podcasts", "zh": "彭博播客"}, "date": "2026-05-26", "min": 52, "fields": ["deep-learning"], "src": "https://youtu.be/7bWqp3oZyXg", "tEn": "Cerebras CEO on Giant Wafers and AI Chips", "tZh": "Cerebras CEO 谈巨型晶圆与 AI 芯片", "addedAt": "2026-07-19T01:37:10Z"}, {"id": "boris-caseynew-2026", "pid": "boris", "pod": {"en": "Casey Newton", "zh": "Casey Newton"}, "date": "2026-05-26", "min": 62, "fields": ["nlp"], "src": "https://youtu.be/PZ9u6DR8qOU", "tEn": "Will AI Replace Software Engineers?", "tZh": "AI 会取代软件工程师吗？", "addedAt": "2026-06-17"}, {"id": "felixrieseberg-howiai-2026", "pid": "felixrieseberg", "pod": {"en": "How I AI", "zh": "How I AI"}, "date": "2026-05-25", "min": 59, "fields": ["product", "nlp"], "src": "https://youtu.be/-tdNsYi8AXs", "tEn": "Building Better with Claude: From Hardware Buddies to AI-Native Kids", "tZh": "用 Claude 构建更好的 AI 体验：从硬件伙伴到 AI 原生代", "addedAt": "2026-07-22T01:29:07Z"}, {"id": "evanspiegel-tigersis-2026", "pid": "evanspiegel", "pod": {"en": "Tiger Sisters", "zh": "虎姐妹"}, "date": "2026-05-25", "min": 73, "fields": ["deep-learning", "product"], "src": "https://youtu.be/0IYBJXS-1t8", "tEn": "Evan Spiegel on Gen Z, Snapchat's Vision, and the Future of Tech", "tZh": "Evan Spiegel 谈 Z 世代、Snapchat 愿景与科技未来", "addedAt": "2026-07-20T01:33:09Z"}, {"id": "jonyive-hugeiftr-2026", "pid": "jonyive", "pod": {"en": "Huge If True", "zh": "Huge If True"}, "date": "2026-05-25", "min": 45, "fields": ["product"], "src": "https://youtu.be/K-o0r2zSgCE", "tEn": "Ferrari's First Electric Car: A Controversial Risk", "tZh": "法拉利首款电动车：一场充满争议的冒险", "addedAt": "2026-08-14T09:37:37Z"}, {"id": "danshipper-lennyspo-2026", "pid": "danshipper", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2026-05-24", "min": 94, "fields": ["nlp"], "src": "https://youtu.be/4D3hDmGhFhA", "tEn": "AI Job Apocalypse Is a Lie: Dan Shipper’s Bold Predictions for Work in 2025", "tZh": "AI 工作末日是谎言：Dan Shipper 对 2025 年工作的大胆预测", "addedAt": "2026-07-14T14:06:34Z"}, {"id": "feldman-parzival-2026", "pid": "feldman", "pod": {"en": "Parzival of Algorithmic Progress", "zh": "算法进步帕西法尔"}, "date": "2026-05-22", "min": 42, "fields": ["deep-learning"], "src": "https://youtu.be/LJw3K52lmew", "tEn": "Cerebras CEO on $95B IPO, Wafer-Scale Chips, and AI Hardware", "tZh": "Cerebras CEO 谈 950 亿美元 IPO、晶圆级芯片与 AI 硬件", "addedAt": "2026-07-16T01:33:43Z"}, {"id": "reinerpope-dwarkesh-2026b", "pid": "reinerpope", "pod": {"en": "Dwarkesh Podcast", "zh": "Dwarkesh 播客"}, "date": "2026-05-22", "min": 80, "fields": ["deep-learning"], "src": "https://youtu.be/oIk3R-sMX5o", "tEn": "How AI Chips Work: From Logic Gates to Matrix Multiplication", "tZh": "AI 芯片工作原理：从逻辑门到矩阵乘法", "addedAt": "2026-07-14T01:13:19Z"}, {"id": "oriol-unsuperv-2026", "pid": "oriol", "pod": {"en": "Unsupervised Learning", "zh": "Unsupervised Learning"}, "date": "2026-05-22", "min": 60, "fields": ["deep-learning", "rl"], "src": "https://youtu.be/NQczevdpxq0", "tEn": "Oriol Vinyals on World Models, Multimodal AI, and the Path to AGI", "tZh": "Oriol Vinyals 谈世界模型、多模态 AI 及通往 AGI 之路", "addedAt": "2026-07-03"}, {"id": "jureleskovec-thetwiml-2026", "pid": "jureleskovec", "pod": {"en": "The TWIML AI Podcast", "zh": "TWIML AI 播客"}, "date": "2026-05-21", "min": 66, "fields": ["deep-learning", "bio"], "src": "https://youtu.be/khSSuUyvqno", "tEn": "Relational Foundation Model and AI Virtual Cell", "tZh": "关系基础模型与 AI 虚拟细胞", "addedAt": "2026-07-14T14:53:00Z"}, {"id": "feldman-nopriors-2026", "pid": "feldman", "pod": {"en": "No Priors", "zh": "No Priors 播客"}, "date": "2026-05-21", "min": 31, "fields": ["deep-learning"], "src": "https://youtu.be/jeop9wfb9jU", "tEn": "Cerebras CEO on Fast AI Inference and the Future of Computing", "tZh": "Cerebras CEO 谈快速 AI 推理与计算未来", "addedAt": "2026-07-14T01:32:48Z"}, {"id": "boris-bigtechn-2026", "pid": "boris", "pod": {"en": "Big Technology", "zh": "Big Technology 播客"}, "date": "2026-05-20", "min": 57, "fields": ["deep-learning", "nlp"], "src": "https://youtu.be/Z6IT4gjrcPE", "tEn": "Claude Code's Explosive Growth and the Future of AI Agents", "tZh": "Claude Code 的爆炸性增长与 AI 代理的未来", "addedAt": "2026-07-02"}, {"id": "mjordan-machinel-2026", "pid": "mjordan", "pod": {"en": "Machine Learning Street Talk", "zh": "ML Street Talk"}, "date": "2026-05-20", "min": 77, "fields": ["deep-learning"], "src": "https://youtu.be/AREWYbVtX64", "tEn": "AI Hype Hurts Young Innovators", "tZh": "AI 炒作伤害年轻创新者", "addedAt": "2026-06-27"}, {"id": "noambrown-arcprize-2026", "pid": "noambrown", "pod": {"en": "ARC Prize", "zh": "ARC Prize"}, "date": "2026-05-20", "min": 40, "fields": ["rl", "nlp"], "src": "https://youtu.be/wKwLDaPP6YI", "tEn": "Defining AGI: The Novel Test and Measuring Intelligence", "tZh": "定义 AGI：小说测试与智能衡量", "addedAt": "2026-06-17"}, {"id": "tommygeoco-diveclub-2026", "pid": "tommygeoco", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-05-19", "min": 60, "fields": ["product"], "src": "https://youtu.be/OYNoy468kS8", "tEn": "Designers Embrace Vibe Coding and DIY Tools", "tZh": "设计师拥抱氛围编程与自主工具", "addedAt": "2026-08-01T09:27:10Z", "reingestedAt": "2026-08-02T06:38:20Z"}, {"id": "dario-oprah-2026", "pid": "dario", "pod": {"en": "Oprah", "zh": "奥普拉"}, "date": "2026-05-19", "min": 66, "fields": ["safety"], "src": "https://youtu.be/w5dJqHilu5s", "tEn": "The Parents of Claude: Steering AI at the Speed of Trust", "tZh": "Claude 的父母：以信任的速度驾驭 AI", "addedAt": "2026-07-12T08:45:04Z"}, {"id": "altman-stripese-2026", "pid": "altman", "pod": {"en": "Stripe Sessions", "zh": "Stripe Sessions"}, "date": "2026-05-19", "min": 57, "fields": ["deep-learning", "safety"], "src": "https://youtu.be/5eouRdDYM2c", "tEn": "Codex's Inflection Point: Why Coding AI Suddenly Got Good", "tZh": "Codex 的转折点：为什么编程 AI 突然变得如此出色", "addedAt": "2026-07-02"}, {"id": "lambert-aiproem-2026", "pid": "lambert", "pod": {"en": "AI Proem", "zh": "AI Proem"}, "date": "2026-05-19", "min": 63, "fields": ["nlp"], "src": "https://youtu.be/GuLw_EAVwgc", "tEn": "Inside China's AI Labs: Nathan Lambert on Open Models, Compute Constraints, and US-China Divergence", "tZh": "探秘中国 AI 实验室：Nathan Lambert 谈开源模型、算力限制与中美分化", "addedAt": "2026-06-17"}, {"id": "caitlin-lennyspo-2026", "pid": "caitlin", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2026-05-17", "min": 99, "fields": ["robotics"], "src": "https://youtu.be/G5WTgB87rYQ", "tEn": "From VR to Robotics: The Next Frontier in Physical AI", "tZh": "从 VR 到机器人：物理 AI 的下一个前沿", "addedAt": "2026-07-04"}, {"id": "altman-cnn-2026", "pid": "altman", "pod": {"en": "CNN", "zh": "CNN"}, "date": "2026-05-16", "min": 24, "fields": ["deep-learning", "bio"], "src": "https://youtu.be/R8_uTmpqafE", "tEn": "Longevity, Healthcare, and the Role of Government in Tech Innovation", "tZh": "长寿、医疗保健与政府在科技创新中的角色", "addedAt": "2026-07-05"}, {"id": "ericjang-dwarkesh-2026", "pid": "ericjang", "pod": {"en": "Dwarkesh Podcast", "zh": "Dwarkesh 播客"}, "date": "2026-05-15", "min": 157, "fields": ["rl", "robotics"], "src": "https://youtu.be/X_ZVSPcZhtw", "tEn": "Building AlphaGo from Scratch: Insights for AI Research", "tZh": "从零构建 AlphaGo：AI 研究启示录", "addedAt": "2026-07-07T00:05:00Z"}, {"id": "lecun-unsuperv", "pid": "lecun", "pod": {"en": "Unsupervised Learning", "zh": "Unsupervised Learning"}, "date": "2026-05-15", "min": 82, "fields": ["deep-learning", "robotics"], "src": "https://youtu.be/ngBraLDqzdI", "tEn": "What comes after LLMs", "tZh": "LLM 之后会是什么", "addedAt": "2026-06-17"}, {"id": "brettadcock-overtheh-2026", "pid": "brettadcock", "pod": {"en": "Over The Horizon", "zh": "地平线之外"}, "date": "2026-05-14", "min": 58, "fields": ["robotics"], "src": "https://youtu.be/og0VF9-XCSs", "tEn": "Autonomous Robots in Warehouse: A Live Demo", "tZh": "仓库中的自主机器人：现场演示", "addedAt": "2026-08-19T01:33:41Z"}, {"id": "awang-corememo", "pid": "awang", "pod": {"en": "Core Memory", "zh": "Core Memory 播客"}, "date": "2026-05-13", "min": 83, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/bYM_VMs7EO0", "tEn": "Alex Wang on Meta's AI Strategy and New Model Release", "tZh": "Alex Wang 谈 Meta 的 AI 战略与新模型发布", "addedAt": "2026-06-17"}, {"id": "garrytan-tetragra-2026", "pid": "garrytan", "pod": {"en": "Tetragrammaton", "zh": "Tetragrammaton"}, "date": "2026-05-13", "min": 125, "fields": ["product"], "src": "https://youtu.be/bTxALvFKP8M", "tEn": "From Code Caves to Y Combinator: A Journey of Resilience and Innovation", "tZh": "从代码洞穴到 Y Combinator：坚韧与创新之旅", "addedAt": "2026-08-16T09:37:56Z"}, {"id": "katarinabatina-diveclub-2026", "pid": "katarinabatina", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-05-12", "min": 55, "fields": ["product"], "src": "https://youtu.be/0YjO7wShTkQ", "tEn": "Making Big Bets with Design: The Story of Shop App", "tZh": "用设计下大赌注：Shop App 的故事", "addedAt": "2026-07-21T14:58:51Z"}, {"id": "jennywen-aidesign-2026", "pid": "jennywen", "pod": {"en": "AI & Design Podcast", "zh": "AI与设计播客"}, "date": "2026-05-12", "min": 40, "fields": ["nlp", "product"], "src": "https://youtu.be/gHz08dRvi-8", "tEn": "AI and Design: Three Designer Archetypes for the AI Era", "tZh": "AI 与设计：AI 时代的三种设计师原型", "addedAt": "2026-07-16T01:34:53Z"}, {"id": "naval-naval-2026f", "pid": "naval", "pod": {"en": "Naval", "zh": "纳瓦尔播客"}, "date": "2026-05-11", "min": 28, "fields": ["deep-learning"], "src": "https://youtu.be/l1DQgwomzxU", "tEn": "Naval on Sales: Credibility Over Tactics", "tZh": "Naval 谈销售：可信度胜过技巧", "addedAt": "2026-07-05"}, {"id": "angelajiang-aii-2026", "pid": "angelajiang", "pod": {"en": "AI & I", "zh": "AI & I"}, "date": "2026-05-08", "min": 43, "fields": ["product", "nlp"], "src": "https://youtu.be/lLypHkIVLqc", "tEn": "The Future of AI Platforms: Claude's Evolution and Scaling", "tZh": "AI 平台的未来：Claude 的演进与扩展", "addedAt": "2026-07-20T07:16:59Z"}, {"id": "bengio-jonherna-2026", "pid": "bengio", "pod": {"en": "Jon Hernandez AI (Inteligencia Artificial con Jon Hernandez)", "zh": "Jon Hernandez AI 播客"}, "date": "2026-05-08", "min": 141, "fields": ["safety", "deep-learning"], "src": "https://youtu.be/_-CuF1likvw", "tEn": "AI Godfather Yoshua Bengio: Why I Changed My Mind About AI", "tZh": "AI 教父约书亚·本吉奥：我为何改变了对 AI 的看法", "addedAt": "2026-07-02"}, {"id": "fiona-claude-2026", "pid": "fiona", "pod": {"en": "Claude", "zh": "Claude 官方频道"}, "date": "2026-05-08", "min": 29, "fields": ["product", "nlp"], "src": "https://youtu.be/igO8iyca2_g", "tEn": "From Bottlenecks to Breakthroughs: Scaling Claude Code", "tZh": "从瓶颈到突破：扩展 Claude Code 的团队经验", "addedAt": "2026-08-16T09:48:07Z"}, {"id": "bengio-80000hou", "pid": "bengio", "pod": {"en": "80,000 Hours", "zh": "80,000 小时"}, "date": "2026-05-07", "min": 155, "fields": ["deep-learning", "safety"], "src": "https://youtu.be/PZqDFs2sbiY", "tEn": "How to make safe superintelligent AI", "tZh": "如何造出安全的超级智能", "addedAt": "2026-06-17"}, {"id": "kolter-themadpo", "pid": "kolter", "pod": {"en": "The MAD Podcast", "zh": "Matt Turck 的 MAD 播客"}, "date": "2026-05-07", "min": 77, "fields": ["safety", "deep-learning"], "src": "https://youtu.be/DvyZcCfepeI", "tEn": "AI Safety Oversight at OpenAI: A Conversation with Ziko Culture", "tZh": "OpenAI 的安全监督：与 Ziko Culture 的对话", "addedAt": "2026-06-17"}, {"id": "rafaconde-diveclub-2026", "pid": "rafaconde", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-05-05", "min": 59, "fields": ["product"], "src": "https://youtu.be/3rnhlZj25iY", "tEn": "Designing for Emotion: A Conversation with Rafael Conde", "tZh": "设计情感：与 Rafael Conde 的对话", "addedAt": "2026-08-01T09:37:06Z", "reingestedAt": "2026-08-02T06:06:59Z"}, {"id": "bethbarnes-machinel-2026", "pid": "bethbarnes", "pod": {"en": "Machine Learning Street Talk", "zh": "ML Street Talk"}, "date": "2026-05-04", "min": 113, "fields": ["safety"], "src": "https://youtu.be/zSAGzfspuDE", "tEn": "Evaluating AI Capabilities and Risks: A Conversation with Beth and David", "tZh": "评估 AI 能力与风险：与 Beth 和 David 的对话", "addedAt": "2026-07-14T14:12:04Z"}, {"id": "boris-training-2026", "pid": "boris", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2026-05-04", "min": 25, "fields": ["nlp"], "src": "https://youtu.be/SlGRN8jh2RI", "tEn": "Claude Code: The Accidental Revolution in Software Development", "tZh": "Claude Code：意外引发的软件开发革命", "addedAt": "2026-07-12T07:19:09Z"}, {"id": "naval-naval-2026e", "pid": "naval", "pod": {"en": "Naval", "zh": "纳瓦尔播客"}, "date": "2026-05-04", "min": 20, "fields": ["deep-learning"], "src": "https://youtu.be/lIUEJqIDPcA", "tEn": "Naval on Flat Organizations and AI's Implicit Role", "tZh": "Naval 谈扁平化组织与 AI 的隐性作用", "addedAt": "2026-07-05"}, {"id": "altman-nothingb-2026", "pid": "altman", "pod": {"en": "NothingButTech", "zh": "NothingButTech"}, "date": "2026-05-01", "min": 43, "fields": ["nlp", "safety"], "src": "https://youtu.be/Mklj3Y2-fNg", "tEn": "Sam Altman on ChatGPT's Personality and the Path to Superintelligence", "tZh": "Sam Altman 谈 ChatGPT 个性与通往超级智能之路", "addedAt": "2026-06-17"}, {"id": "brockman-sequoiac-2026", "pid": "brockman", "pod": {"en": "Sequoia Capital", "zh": "红杉资本"}, "date": "2026-04-30", "min": 28, "fields": ["deep-learning"], "src": "https://youtu.be/bBS93A0BeNI", "tEn": "OpenAI's Compute Strategy and Scaling Laws", "tZh": "OpenAI 的计算策略与缩放定律", "addedAt": "2026-07-02"}, {"id": "philipkiely-thetwiml-2026", "pid": "philipkiely", "pod": {"en": "The TWIML AI Podcast", "zh": "TWIML AI 播客"}, "date": "2026-04-30", "min": 54, "fields": ["deep-learning", "product"], "src": "https://youtu.be/k_tn-e6FWsU", "tEn": "The Fastest Timeline in AI: Inference Engineering", "tZh": "AI 中最快的时间线：推理工程", "addedAt": "2026-08-10T01:33:38Z"}, {"id": "brettadcock-sourcery-2026", "pid": "brettadcock", "pod": {"en": "Sourcery with Molly O'Shea", "zh": "Sourcery · 莫莉·奥谢"}, "date": "2026-04-30", "min": 33, "fields": ["robotics"], "src": "https://youtu.be/g1ESjEGG1SM", "tEn": "Figure AI CEO: Humanoid Robots Are the Biggest Business in the World", "tZh": "Figure AI CEO：人形机器人是世界上最伟大的事业", "addedAt": "2026-08-17T03:35:36Z"}, {"id": "demis-ycombina-2026", "pid": "demis", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2026-04-29", "min": 41, "fields": ["deep-learning", "safety"], "src": "https://youtu.be/JNyuX1zoOgU", "tEn": "Demis Hassabis: The Path to AGI and Missing Pieces", "tZh": "Demis Hassabis：通往 AGI 之路与缺失的拼图", "addedAt": "2026-07-07T00:11:00Z"}, {"id": "reinerpope-dwarkesh-2026", "pid": "reinerpope", "pod": {"en": "Dwarkesh Podcast", "zh": "Dwarkesh 播客"}, "date": "2026-04-29", "min": 134, "fields": ["deep-learning"], "src": "https://youtu.be/xmkSf5IS-zw", "tEn": "AI Inference Economics: Batch Size, Latency, and Cost", "tZh": "AI 推理经济学：批次大小、延迟与成本", "addedAt": "2026-07-07T00:04:00Z"}, {"id": "karpathy-training", "pid": "karpathy", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2026-04-29", "min": 30, "fields": ["nlp"], "src": "https://youtu.be/96jN2OCOfLs", "tEn": "From vibe coding to agentic engineering", "tZh": "从「氛围编程」到智能体工程", "addedAt": "2026-06-17"}, {"id": "pollydarcy-diveclub-2026", "pid": "pollydarcy", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-04-28", "min": 55, "fields": ["product"], "src": "https://youtu.be/vdYBohOQYm0", "tEn": "From IC to VP: Polly D'Arcy on Imposter Syndrome and Design Leadership", "tZh": "从 IC 到 VP：Polly D'Arcy 谈冒充者综合征与设计领导力", "addedAt": "2026-08-01T10:17:25Z"}, {"id": "naval-naval-2026d", "pid": "naval", "pod": {"en": "Naval", "zh": "纳瓦尔播客"}, "date": "2026-04-28", "min": 30, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/hTdSU7q5WCo", "tEn": "Vibe Coding: The End of iPhone Dominance?", "tZh": "氛围编程：iPhone 主导地位的终结？", "addedAt": "2026-07-05"}, {"id": "evanspiegel-cheekypi-2026", "pid": "evanspiegel", "pod": {"en": "Cheeky Pint", "zh": "Cheeky Pint"}, "date": "2026-04-27", "min": 64, "fields": ["deep-learning", "product"], "src": "https://youtu.be/8fZNK-M-77I", "tEn": "Snap CEO on Spectacles, AI, and the Future of Computing", "tZh": "Snap CEO 谈 Spectacles、AI 与计算的未来", "addedAt": "2026-07-19T14:36:17Z"}, {"id": "evanspiegel-lennyspo-2026", "pid": "evanspiegel", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2026-04-26", "min": 70, "fields": ["deep-learning", "product"], "src": "https://youtu.be/-7Yol5vX5xw", "tEn": "Why Building a Durable Social Consumer Product Is So Hard", "tZh": "为什么打造持久的社交消费产品如此困难", "addedAt": "2026-07-19T14:31:19Z"}, {"id": "aravind-thisweek-2026", "pid": "aravind", "pod": {"en": "This Week in AI", "zh": "This Week in AI"}, "date": "2026-04-23", "min": 80, "fields": ["deep-learning"], "src": "https://youtu.be/Xwjr_jxGFG8", "tEn": "The Future of AI Coding and Application Value", "tZh": "AI 编程的未来与应用价值", "addedAt": "2026-07-07T00:13:00Z"}, {"id": "brockman-bigtechn-2026", "pid": "brockman", "pod": {"en": "Big Technology", "zh": "Big Technology 播客"}, "date": "2026-04-23", "min": 26, "fields": ["deep-learning"], "src": "https://youtu.be/YnoQ8RJbALw", "tEn": "OpenAI President Greg Brockman on GPT-5.5 (Spud) and the Future of AI", "tZh": "OpenAI 总裁 Greg Brockman 谈 GPT-5.5（Spud）与 AI 未来", "addedAt": "2026-07-02"}, {"id": "catwu-lennyspo", "pid": "catwu", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2026-04-23", "min": 86, "fields": ["nlp", "product"], "src": "https://youtu.be/PplmzlgE0kg", "tEn": "The New PM Playbook for AI-Native Products", "tZh": "AI 原生产品的新产品经理手册", "addedAt": "2026-06-17"}, {"id": "shawnwang-unsuperv-2026", "pid": "shawnwang", "pod": {"en": "Unsupervised Learning", "zh": "Unsupervised Learning"}, "date": "2026-04-23", "min": 55, "fields": ["product", "nlp"], "src": "https://youtu.be/A_7WafI9bhE", "tEn": "AI Coding Wars and the Future of Agents", "tZh": "AI 编程之战与智能体的未来", "addedAt": "2026-08-07T01:36:40Z"}, {"id": "altman-corememo-2026", "pid": "altman", "pod": {"en": "Core Memory", "zh": "Core Memory 播客"}, "date": "2026-04-22", "min": 83, "fields": ["nlp", "product"], "src": "https://youtu.be/NCKQL0op30E", "tEn": "Sam Altman and Greg Brockman on Their 10-Year Journey at OpenAI", "tZh": "Sam Altman 和 Greg Brockman 谈 OpenAI 十年历程", "addedAt": "2026-07-02"}, {"id": "brockman-theknowl-2026", "pid": "brockman", "pod": {"en": "The Knowledge Project Podcast", "zh": "知识项目播客"}, "date": "2026-04-22", "min": 72, "fields": ["nlp", "product"], "src": "https://youtu.be/6JoUcQ1qmAc", "tEn": "The Birth of OpenAI: From a Dinner to a Mission", "tZh": "OpenAI 的诞生：从晚餐到使命", "addedAt": "2026-06-20"}, {"id": "pathak-nvidia-2026", "pid": "pathak", "pod": {"en": "NVIDIA", "zh": "NVIDIA"}, "date": "2026-04-22", "min": 30, "fields": ["robotics"], "src": "https://youtu.be/9YyS1R4xZ0M", "tEn": "Skild AI: Building a Universal Brain for Robots", "tZh": "Skild AI：为机器人打造通用大脑", "addedAt": "2026-08-17T03:36:33Z"}, {"id": "brandonjacoby-diveclub-2026", "pid": "brandonjacoby", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-04-21", "min": 53, "fields": ["product"], "src": "https://youtu.be/RaKFP_DuqpA", "tEn": "Taste, AI, and Decisiveness: A Designer's Journey from X to Independence", "tZh": "品味、AI 与决断力：一位设计师从 X 到独立之路", "addedAt": "2026-07-21T15:11:09Z"}, {"id": "mensch-lisaburk-2026", "pid": "mensch", "pod": {"en": "Lisa Burke", "zh": "Lisa Burke（EIB 集团论坛）"}, "date": "2026-04-20", "min": 19, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/wBuvZpf-Ato", "tEn": "Mistral: Europe's AI Champion for Strategic Autonomy", "tZh": "Mistral：欧洲 AI 冠军，追求战略自主", "addedAt": "2026-07-02"}, {"id": "gomez-upstarts-2026", "pid": "gomez", "pod": {"en": "Upstarts Media", "zh": "Upstarts Media"}, "date": "2026-04-16", "min": 42, "fields": ["nlp"], "src": "https://youtu.be/RZ9I_CsDaoo", "tEn": "Cohere's Takeoff: AI for Secure Enterprises", "tZh": "Cohere 的起飞：面向安全企业的 AI", "addedAt": "2026-06-23"}, {"id": "kendall-gradient-2026", "pid": "kendall", "pod": {"en": "Gradient Dissent", "zh": "Gradient Dissent"}, "date": "2026-04-15", "min": 46, "fields": ["robotics"], "src": "https://youtu.be/k5wgts8y-xU", "tEn": "From Farm to Frontier: Alex Kendall on Wayve's End-to-End AI for Autonomous Driving", "tZh": "从农场到前沿：Alex Kendall 谈 Wayve 的端到端自动驾驶 AI", "addedAt": "2026-07-14T15:11:54Z"}, {"id": "jensen-dwarkesh", "pid": "jensen", "pod": {"en": "Dwarkesh Podcast", "zh": "Dwarkesh 播客"}, "date": "2026-04-15", "min": 103, "fields": ["deep-learning", "robotics"], "src": "https://youtu.be/Hrbq66XqtCo", "tEn": "Will Nvidia’s moat persist?", "tZh": "英伟达的护城河守得住吗?", "addedAt": "2026-06-17"}, {"id": "brianlovin-diveclub-2026", "pid": "brianlovin", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-04-14", "min": 55, "fields": ["product"], "src": "https://youtu.be/dvEwb1Ajkwo", "tEn": "Designing the Future: Brian Lovin on AI, Notion, and Blurring Roles", "tZh": "设计未来：Brian Lovin 谈 AI、Notion 与角色融合", "addedAt": "2026-08-01T09:04:53Z", "reingestedAt": "2026-08-02T07:39:17Z"}, {"id": "dylanfield-peteryan-2026", "pid": "dylanfield", "pod": {"en": "Peter Yang", "zh": "彼得·杨"}, "date": "2026-04-12", "min": 41, "fields": ["product"], "src": "https://youtu.be/eqPljh_9C9Y", "tEn": "Design in the Age of AI: Taste, Craft, and Point of View", "tZh": "AI 时代的设计：品味、工艺与观点", "addedAt": "2026-07-22T01:30:26Z"}, {"id": "pachocki-unsuperv-2026", "pid": "pachocki", "pod": {"en": "Unsupervised Learning", "zh": "Unsupervised Learning"}, "date": "2026-04-09", "min": 59, "fields": ["deep-learning", "safety"], "src": "https://youtu.be/vK1qEF3a3WM", "tEn": "Ilya Sutskever on AI Progress, Alignment, and Timelines", "tZh": "Ilya Sutskever 谈 AI 进展、对齐和时间线", "addedAt": "2026-07-07T00:01:00Z"}, {"id": "jeffdean-nvidia-2026", "pid": "jeffdean", "pod": {"en": "NVIDIA", "zh": "NVIDIA"}, "date": "2026-04-09", "min": 59, "fields": ["deep-learning", "nlp"], "src": "https://youtu.be/DqMIYc-keBQ", "tEn": "Google Chief Scientist Jeff Dean and NVIDIA Chief Scientist Bill Dally Discuss AI Progress and Low-Latency Inference", "tZh": "谷歌首席科学家 Jeff Dean 与英伟达首席科学家 Bill Dally 探讨 AI 进展与低延迟推理", "addedAt": "2026-06-17"}, {"id": "iansilber-diveclub-2026", "pid": "iansilber", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-04-08", "min": 45, "fields": ["nlp", "product"], "src": "https://youtu.be/oM1d9Tau27w", "tEn": "Designing with AI: Inside OpenAI's Product Design", "tZh": "与 AI 共设计：OpenAI 产品设计内幕", "addedAt": "2026-07-15T06:59:48Z"}, {"id": "evanspiegel-thefutur-2026", "pid": "evanspiegel", "pod": {"en": "The Futurology Podcast", "zh": "Futurology 播客"}, "date": "2026-04-07", "min": 72, "fields": ["deep-learning", "product"], "src": "https://youtu.be/Q49rfO_Gvqw", "tEn": "Evan Spiegel on Snapchat's Origin and AR Future", "tZh": "Evan Spiegel 谈 Snapchat 起源与 AR 未来", "addedAt": "2026-07-19T14:33:43Z"}, {"id": "demis-hugeiftr", "pid": "demis", "pod": {"en": "Huge If True", "zh": "Huge If True"}, "date": "2026-04-07", "min": 65, "fields": ["deep-learning", "rl", "bio"], "src": "https://youtu.be/C0gErQtnNFE", "tEn": "The hardest problem AI ever solved", "tZh": "AI 解决过的最难的问题", "addedAt": "2026-06-17"}, {"id": "amolavasare-lennyspo-2026", "pid": "amolavasare", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2026-04-05", "min": 113, "fields": ["deep-learning"], "src": "https://youtu.be/k-H4nsOTuxU", "tEn": "Inside Anthropic's Unprecedented Growth: From $1B to $19B ARR in 14 Months", "tZh": "揭秘 Anthropic 史无前例的增长：14 个月内从 10 亿到 190 亿美元 ARR", "addedAt": "2026-07-14T13:56:40Z"}, {"id": "fedus-nopriors-2026", "pid": "fedus", "pod": {"en": "No Priors", "zh": "No Priors 播客"}, "date": "2026-04-03", "min": 29, "fields": ["nlp", "robotics"], "src": "https://youtu.be/Oru2Jxr1xHU", "tEn": "From ChatGPT to Atoms: Liam Fedus on AI for the Physical World", "tZh": "从 ChatGPT 到原子：Liam Fedus 谈 AI 在物理世界的应用", "addedAt": "2026-06-23"}, {"id": "marvinschwaibold-diveclub-2026", "pid": "marvinschwaibold", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-04-02", "min": 55, "fields": ["product"], "src": "https://youtu.be/KpJs7mZYErg", "tEn": "From Graphic Design to Tech: Marvin Schwaibold's Journey to Shopify", "tZh": "从平面设计到科技：Marvin Schwaibold 的 Shopify 之旅", "addedAt": "2026-07-21T08:38:01Z"}, {"id": "simonwillison-lennyspo-2026", "pid": "simonwillison", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2026-04-02", "min": 100, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/wc8FBhQtdsA", "tEn": "The AI Coding Revolution: From 10,000 Lines a Day to the Challenger Disaster", "tZh": "AI 编程革命：从日写万行代码到挑战者号灾难", "addedAt": "2026-07-14T13:51:22Z"}, {"id": "brockman-bigtechn", "pid": "brockman", "pod": {"en": "Big Technology", "zh": "Big Technology 播客"}, "date": "2026-04-01", "min": 73, "fields": ["nlp", "safety"], "src": "https://youtu.be/J6vYvk7R190", "tEn": "Greg Brockman on AI that improves itself", "tZh": "格雷格·布罗克曼谈会自我改进的 AI", "addedAt": "2026-06-17"}, {"id": "edwinchen-stanford-2026", "pid": "edwinchen", "pod": {"en": "Stanford Department of Medicine", "zh": "斯坦福医学院"}, "date": "2026-03-30", "min": 44, "fields": ["nlp", "bio"], "src": "https://youtu.be/Vr8o7u3iFf4", "tEn": "AI in Medicine: Magic, Judgment, and the Future", "tZh": "医学中的 AI：魔法、判断力与未来", "addedAt": "2026-07-13T01:32:47Z"}, {"id": "clairevo-lennyspo-2026", "pid": "clairevo", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2026-03-29", "min": 107, "fields": ["nlp", "product"], "src": "https://youtu.be/DIa0MYJzM5I", "tEn": "From Skeptic to Power User: Claire Vo on OpenClaw", "tZh": "从怀疑到重度用户：Claire Vo 谈 OpenClaw", "addedAt": "2026-07-14T14:01:55Z"}, {"id": "slevine-aiagentf-2026", "pid": "slevine", "pod": {"en": "AI Agent Frontier", "zh": "AI Agent Frontier"}, "date": "2026-03-29", "min": 60, "fields": ["rl", "robotics"], "src": "https://youtu.be/_b-FwaiETwM", "tEn": "From Language Models to Physical Agents: The Frontier of Robot Foundation Models", "tZh": "从语言模型到物理智能体：机器人基础模型的前沿", "addedAt": "2026-06-23"}, {"id": "ermon-thetwiml-2026", "pid": "ermon", "pod": {"en": "The TWIML AI Podcast", "zh": "TWIML AI 播客"}, "date": "2026-03-26", "min": 63, "fields": ["deep-learning", "nlp"], "src": "https://youtu.be/UDNDOf5hT-A", "tEn": "Diffusion LLMs: Faster, Cheaper, and Scaling Better Than Autoregressive Models", "tZh": "扩散 LLM：比自回归模型更快、更便宜、扩展性更好", "addedAt": "2026-07-14T14:55:01Z"}, {"id": "bengio-radiodav-2026", "pid": "bengio", "pod": {"en": "Radio Davos (World Economic Forum)", "zh": "达沃斯电台（世界经济论坛）"}, "date": "2026-03-26", "min": 28, "fields": ["safety", "deep-learning"], "src": "https://youtu.be/Zdv3yU1i_R8", "tEn": "AI Self-Preservation and Goal Misalignment Risks", "tZh": "AI 的自我保存与目标错位风险", "addedAt": "2026-07-02"}, {"id": "floraguo-diveclub-2026", "pid": "floraguo", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-03-25", "min": 47, "fields": ["product"], "src": "https://youtu.be/mdV8APhz2j4", "tEn": "Design Engineering in the AI Era: A Conversation with Flora Guo", "tZh": "AI 时代的设计工程：与 Flora Guo 的对话", "addedAt": "2026-08-01T10:27:08Z", "reingestedAt": "2026-08-02T06:57:52Z"}, {"id": "mikekrieger-aii-2026b", "pid": "mikekrieger", "pod": {"en": "AI & I", "zh": "AI & I"}, "date": "2026-03-25", "min": 48, "fields": ["product", "nlp"], "src": "https://youtu.be/KRv9GpJYrUA", "tEn": "The Art of Product Building in the Age of AI", "tZh": "AI 时代的产品构建艺术", "addedAt": "2026-07-20T07:25:06Z"}, {"id": "hinton-theamber-2026", "pid": "hinton", "pod": {"en": "The AmberMac Show", "zh": "AmberMac 秀"}, "date": "2026-03-24", "min": 61, "fields": ["safety", "deep-learning"], "src": "https://youtu.be/9OQoIHrgPbs", "tEn": "Geoffrey Hinton on AI Safety, Radiologists, and Leaving the US for Canada", "tZh": "杰弗里·辛顿谈 AI 安全、放射科医生以及离开美国前往加拿大", "addedAt": "2026-07-02"}, {"id": "jensen-lexfridm-2026", "pid": "jensen", "pod": {"en": "Lex Fridman Podcast", "zh": "Lex Fridman 播客"}, "date": "2026-03-23", "min": 146, "fields": ["deep-learning"], "src": "https://youtu.be/vif8NQcjVf0", "tEn": "Extreme Co-Design: The Key to Nvidia's AI Dominance", "tZh": "极致协同设计：英伟达 AI 主导地位的关键", "addedAt": "2026-07-02"}, {"id": "karpathy-noprior-2026", "pid": "karpathy", "pod": {"en": "No Priors", "zh": "No Priors 播客"}, "date": "2026-03-20", "min": 67, "fields": ["nlp"], "src": "https://youtu.be/kwSVtQ7dziU", "tEn": "Skill issue: code agents and autoresearch", "tZh": "Skill Issue:代码智能体与自动化研究", "addedAt": "2026-06-17"}, {"id": "krispuckett-diveclub-2026", "pid": "krispuckett", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-03-19", "min": 53, "fields": ["product"], "src": "https://youtu.be/nPyxVMd1LIA", "tEn": "From Dream to Reality: An AI Native Designer's Journey", "tZh": "从梦想到现实：一位 AI 原生设计师的旅程", "addedAt": "2026-07-21T15:01:07Z"}, {"id": "jensen-allinpod-2026", "pid": "jensen", "pod": {"en": "All-In Podcast", "zh": "All-In 播客"}, "date": "2026-03-19", "min": 66, "fields": ["deep-learning"], "src": "https://youtu.be/gwW8GKwHB3I", "tEn": "Jensen Huang on Disaggregated Inference and the AI Factory", "tZh": "黄仁勋谈分解推理与 AI 工厂", "addedAt": "2026-07-05"}, {"id": "carlpei-sxsw-2026", "pid": "carlpei", "pod": {"en": "SXSW", "zh": "SXSW"}, "date": "2026-03-18", "min": 59, "fields": ["product"], "src": "https://youtu.be/S9zAUgV6bns", "tEn": "Nothing's Carl Pei on Making Tech Fun Again", "tZh": "Nothing 创始人裴宇：让科技重拾乐趣", "addedAt": "2026-08-14T09:35:58Z"}, {"id": "felixrieseberg-latentsp-2026", "pid": "felixrieseberg", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2026-03-17", "min": 88, "fields": ["product", "nlp"], "src": "https://youtu.be/ZpZ7lFoWaT8", "tEn": "The Future of AI: Local Computers and Claude", "tZh": "AI 的未来：本地计算机与 Claude", "addedAt": "2026-07-20T07:21:11Z"}, {"id": "hausman-thegener-2026", "pid": "hausman", "pod": {"en": "The Generalist", "zh": "The Generalist"}, "date": "2026-03-17", "min": 74, "fields": ["robotics", "rl"], "src": "https://youtu.be/Gtiv9j2fRDU", "tEn": "Building Physical Intelligence: From Disappointment to Breakthrough", "tZh": "构建物理智能：从失望到突破", "addedAt": "2026-06-27"}, {"id": "sutton-stanford-2026", "pid": "sutton", "pod": {"en": "Stanford Digital Economy Lab", "zh": "斯坦福数字经济实验室"}, "date": "2026-03-16", "min": 34, "fields": ["rl", "deep-learning"], "src": "https://youtu.be/n8jRjMkdE4k", "tEn": "Reinforcement Learning: Learning from Experience", "tZh": "强化学习：从经验中学习", "addedAt": "2026-06-17"}, {"id": "turley-bg2pod-2026", "pid": "turley", "pod": {"en": "Bg2 Pod", "zh": "Bg2 Pod"}, "date": "2026-03-15", "min": 64, "fields": ["nlp", "product"], "src": "https://youtu.be/MIKej1HCRW0", "tEn": "From Free Demo to Super Assistant: OpenAI's Journey", "tZh": "从免费演示到超级助手：OpenAI 的旅程", "addedAt": "2026-07-14T14:16:30Z"}, {"id": "garrytan-sxsw-2026", "pid": "garrytan", "pod": {"en": "SXSW", "zh": "SXSW"}, "date": "2026-03-15", "min": 58, "fields": ["product"], "src": "https://youtu.be/W3YpC4Dvzso", "tEn": "Y Combinator's Evolution in the AI Era", "tZh": "Y Combinator 在 AI 时代的演变", "addedAt": "2026-08-16T09:36:12Z"}, {"id": "lipbutan-stanford-2026", "pid": "lipbutan", "pod": {"en": "Stanford (SIEPR)", "zh": "斯坦福 SIEPR"}, "date": "2026-03-13", "min": 26, "fields": ["product"], "src": "https://youtu.be/fnIrYAO0DiU", "tEn": "From Cadence to Intel: A CEO's Playbook for Turnaround", "tZh": "从 Cadence 到 Intel：CEO 的转型策略", "addedAt": "2026-07-19T03:34:28Z"}, {"id": "dylanpatel-dwarkesh-2026", "pid": "dylanpatel", "pod": {"en": "Dwarkesh Podcast", "zh": "Dwarkesh 播客"}, "date": "2026-03-13", "min": 151, "fields": ["deep-learning"], "src": "https://youtu.be/mDG_Hx3BSUE", "tEn": "Hyperscaler Capex and AI Lab Compute Scaling", "tZh": "超大规模资本支出与 AI 实验室算力扩展", "addedAt": "2026-07-07T00:09:00Z"}, {"id": "robertlange-machinel-2026", "pid": "robertlange", "pod": {"en": "Machine Learning Street Talk", "zh": "ML Street Talk"}, "date": "2026-03-13", "min": 78, "fields": ["deep-learning"], "src": "https://youtu.be/EInEmGaMRLc", "tEn": "Evolutionary AI and Scientific Discovery with Robert Lange", "tZh": "进化式 AI 与科学发现：对话 Robert Lange", "addedAt": "2026-07-07T00:08:00Z"}, {"id": "joshpuckett-diveclub-2026", "pid": "joshpuckett", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-03-12", "min": 54, "fields": ["product"], "src": "https://youtu.be/wym3V9FycTk", "tEn": "Uncommon Care in Interface Design: Crafting a Viral Onboarding Experience", "tZh": "界面设计中的非凡关怀：打造病毒式入门体验", "addedAt": "2026-07-21T14:56:53Z"}, {"id": "lecun-thisisth", "pid": "lecun", "pod": {"en": "This Is The World", "zh": "This Is The World"}, "date": "2026-03-11", "min": 51, "fields": ["deep-learning", "robotics"], "src": "https://youtu.be/XnnnAx5lrx8", "tEn": "‘LLMs are a dead end’", "tZh": "「LLM 是一条死路」", "addedAt": "2026-06-17"}, {"id": "luisouriach-diveclub-2026", "pid": "luisouriach", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-03-10", "min": 55, "fields": ["product"], "src": "https://youtu.be/Pn2G7JhxNKc", "tEn": "Design Systems in the AI Era: From Tokens to Centerpiece", "tZh": "AI 时代的设计系统：从令牌到核心", "addedAt": "2026-08-01T10:06:51Z", "reingestedAt": "2026-08-02T05:56:01Z"}, {"id": "kohli-googlede-2026", "pid": "kohli", "pod": {"en": "Google DeepMind", "zh": "Google DeepMind"}, "date": "2026-03-10", "min": 54, "fields": ["deep-learning"], "src": "https://youtu.be/qoinGjj60Fo", "tEn": "AlphaGo: The Match That Changed AI Forever", "tZh": "AlphaGo：改变人工智能的那场对局", "addedAt": "2026-07-06"}, {"id": "markchen-institut-2026", "pid": "markchen", "pod": {"en": "Institute for Pure & Applied Mathematics (IPAM)", "zh": "纯数学与应用数学研究所"}, "date": "2026-03-09", "min": 61, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/ddTvK9nlquM", "tEn": "AI in Mathematics: From Ineffective Grad Student to Gold Medal Performance", "tZh": "AI 在数学领域：从低效研究生到金牌表现", "addedAt": "2026-07-04"}, {"id": "qasaryounis-lennyspo-2026", "pid": "qasaryounis", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2026-03-08", "min": 84, "fields": ["robotics"], "src": "https://youtu.be/_rcniEb9bLw", "tEn": "The AI CEO Nobody Knows: Building the Future of Physical AI", "tZh": "无人知晓的 AI CEO：构建物理 AI 的未来", "addedAt": "2026-07-14T13:53:49Z"}, {"id": "nando-iafrikan-2026", "pid": "nando", "pod": {"en": "iAfrikan Media ", "zh": "iAfrikan 媒体"}, "date": "2026-03-06", "min": 42, "fields": ["deep-learning"], "src": "https://youtu.be/jNbeax0mb3A", "tEn": "AI in Africa: Leapfrogging Challenges and Exceeding Expectations", "tZh": "非洲 AI：跨越挑战，超越期望", "addedAt": "2026-07-04"}, {"id": "cameronworboys-diveclub-2026", "pid": "cameronworboys", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-03-05", "min": 55, "fields": ["product"], "src": "https://youtu.be/KH9GBasDTI8", "tEn": "High Quality, High Velocity: The New Product Development Dream", "tZh": "高质量、高速度：产品开发的新梦想", "addedAt": "2026-07-21T14:54:50Z"}, {"id": "boris-thepragm-2026", "pid": "boris", "pod": {"en": "The Pragmatic Engineer", "zh": "The Pragmatic Engineer"}, "date": "2026-03-04", "min": 98, "fields": ["nlp"], "src": "https://youtu.be/julbw1JuAz0", "tEn": "From Pokémon Cards to AI: The Claude Code Story", "tZh": "从宝可梦卡到 AI：Claude Code 的故事", "addedAt": "2026-06-17"}, {"id": "dario-databric-2026", "pid": "dario", "pod": {"en": "Databricks Fireside", "zh": "Databricks 炉边对话"}, "date": "2026-03-03", "min": 23, "fields": ["deep-learning", "product"], "src": "https://youtu.be/MTsoRWPS46o", "tEn": "Dario Amodei on AI's Future: From Biomedicine to Enterprise Data", "tZh": "Dario Amodei 谈 AI 未来：从生物医学到企业数据", "addedAt": "2026-07-01"}, {"id": "jhoward-machinel-2026", "pid": "jhoward", "pod": {"en": "Machine Learning Street Talk", "zh": "ML Street Talk"}, "date": "2026-03-03", "min": 87, "fields": ["deep-learning", "nlp"], "src": "https://youtu.be/dHBEQ-Ryo24", "tEn": "Jeremy Howard: The Art of Understanding AI", "tZh": "Jeremy Howard：理解 AI 的艺术", "addedAt": "2026-06-27"}, {"id": "jennywen-lennyspo-2026", "pid": "jennywen", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2026-03-01", "min": 77, "fields": ["nlp", "product"], "src": "https://youtu.be/eh8bcBIAAFo", "tEn": "How AI is Reshaping the Design Process", "tZh": "AI 如何重塑设计流程", "addedAt": "2026-07-15T06:10:16Z"}, {"id": "andrewng-thisisth-2026", "pid": "andrewng", "pod": {"en": "This Is The World", "zh": "This Is The World"}, "date": "2026-03-01", "min": 54, "fields": ["deep-learning"], "src": "https://youtu.be/4vzmTKUFtxg", "tEn": "Andrew Ng: AGI Is a Marketing Term, Proposes New Turing Test", "tZh": "吴恩达：AGI 是营销术语，提出新图灵测试", "addedAt": "2026-07-05"}, {"id": "brockman-tetragra-2026", "pid": "brockman", "pod": {"en": "Tetragrammaton", "zh": "Tetragrammaton"}, "date": "2026-02-28", "min": 197, "fields": ["deep-learning"], "src": "https://youtu.be/mI30_ueZ7CU", "tEn": "From Personal AI to Codex: Inside OpenAI's Evolution", "tZh": "从个人 AI 到 Codex：OpenAI 的内部演变", "addedAt": "2026-07-05"}, {"id": "hinton-startalk", "pid": "hinton", "pod": {"en": "StarTalk", "zh": "StarTalk"}, "date": "2026-02-28", "min": 94, "fields": ["deep-learning", "safety"], "src": "https://youtu.be/l6ZcFa8pybE", "tEn": "Is AI hiding its full power?", "tZh": "AI 是否在隐藏它的全部实力?", "addedAt": "2026-06-17"}, {"id": "raschka-thetwiml-2026", "pid": "raschka", "pod": {"en": "The TWIML AI Podcast", "zh": "TWIML AI 播客"}, "date": "2026-02-26", "min": 78, "fields": ["deep-learning", "nlp"], "src": "https://youtu.be/f9jwTSfIPuM", "tEn": "LLMs in 2026: Reasoning, Tool Use, and Post-Training Focus", "tZh": "2026 年的大语言模型：推理、工具使用与后训练焦点", "addedAt": "2026-07-14T14:57:04Z"}, {"id": "dario-peopleby-2026", "pid": "dario", "pod": {"en": "People by WTF", "zh": "People by WTF（尼基尔·卡马特）"}, "date": "2026-02-24", "min": 69, "fields": ["safety", "deep-learning"], "src": "https://youtu.be/68ylaeBbdsg", "tEn": "From Biologist to AI Pioneer: The Story Behind Anthropic", "tZh": "从生物学家到 AI 先驱：Anthropic 背后的故事", "addedAt": "2026-07-01"}, {"id": "katiedill-diveclub-2026", "pid": "katiedill", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-02-23", "min": 54, "fields": ["product"], "src": "https://youtu.be/Dpy-yyYXhgU", "tEn": "Design at Stripe: Evolving Practice with Head of Design Katie Dill", "tZh": "Stripe 的设计实践：与设计主管 Katie Dill 的深度对话", "addedAt": "2026-07-21T08:17:24Z"}, {"id": "naval-naval-2026c", "pid": "naval", "pod": {"en": "Naval", "zh": "纳瓦尔播客"}, "date": "2026-02-19", "min": 52, "fields": ["deep-learning", "safety"], "src": "https://youtu.be/sXCKgEl9hBo", "tEn": "Vibe Coding: The New Product Management", "tZh": "氛围编程：新的产品管理", "addedAt": "2026-07-05"}, {"id": "lecun-aninews-2026", "pid": "lecun", "pod": {"en": "ANI News", "zh": "ANI 新闻"}, "date": "2026-02-19", "min": 59, "fields": ["deep-learning"], "src": "https://youtu.be/qDN7ZjLwdog", "tEn": "Redefining Genius and AI: Beyond LLMs to World Models", "tZh": "重新定义天才与 AI：超越大语言模型，走向世界模型", "addedAt": "2026-07-05"}, {"id": "boris-lennyspo", "pid": "boris", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2026-02-19", "min": 88, "fields": ["nlp"], "src": "https://youtu.be/We7BZVKbCVw", "tEn": "Claude Code: The End of Software Engineering as We Know It", "tZh": "Claude Code：我们所知的软件工程的终结", "addedAt": "2026-06-17"}, {"id": "bengio-centerfo-2026", "pid": "bengio", "pod": {"en": "Center for Humane Technology", "zh": "Center for Humane Technology"}, "date": "2026-02-19", "min": 36, "fields": ["deep-learning", "safety"], "src": "https://youtu.be/2Pel_1BPm_k", "tEn": "Davos 2025: AI's Impact Becomes Visceral", "tZh": "达沃斯 2025：AI 的影响变得切身", "addedAt": "2026-06-17"}, {"id": "julienmartin-diveclub-2026", "pid": "julienmartin", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-02-18", "min": 58, "fields": ["product"], "src": "https://youtu.be/4zvNy_CCK7s", "tEn": "Designing for Delight: Julian Martin on True Differentiation", "tZh": "设计愉悦：Julian Martin 谈真正的差异化", "addedAt": "2026-08-01T09:47:20Z", "reingestedAt": "2026-08-02T06:53:03Z"}, {"id": "ajambrosino-aii-2026", "pid": "ajambrosino", "pod": {"en": "AI & I", "zh": "AI & I"}, "date": "2026-02-18", "min": 47, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/AFHiiL-ZKms", "tEn": "Codex App: From Professional Tool to Mainstream Builder Platform", "tZh": "Codex 应用：从专业工具到主流创造平台", "addedAt": "2026-07-03"}, {"id": "awang-aninewsi-2026", "pid": "awang", "pod": {"en": "ANI News", "zh": "ANI 新闻"}, "date": "2026-02-18", "min": 74, "fields": ["deep-learning", "nlp"], "src": "https://youtu.be/tHrJnEWbYrM", "tEn": "AI's Acceleration: From Pre-training to Recursive Self-Improvement", "tZh": "AI 的加速：从预训练到递归自我改进", "addedAt": "2026-07-02"}, {"id": "boris-ycombina-2026", "pid": "boris", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2026-02-17", "min": 50, "fields": ["nlp"], "src": "https://youtu.be/PQU9o_5rHC4", "tEn": "Building for the Model 6 Months from Now: The Accidental Creation of Claude Code", "tZh": "为六个月后的模型而建：Claude Code 的意外诞生", "addedAt": "2026-06-17"}, {"id": "bengio-siliconv-2026", "pid": "bengio", "pod": {"en": "Silicon Valley Girl", "zh": "硅谷女孩"}, "date": "2026-02-16", "min": 30, "fields": ["safety"], "src": "https://youtu.be/0fXGtQoJgNo", "tEn": "AI's Own Goals: Worst and Best Case Scenarios", "tZh": "AI 的自主目标：最坏与最佳情景", "addedAt": "2026-07-05"}, {"id": "jeffdean-princeto-2026", "pid": "jeffdean", "pod": {"en": "Princeton University", "zh": "普林斯顿大学"}, "date": "2026-02-13", "min": 79, "fields": ["deep-learning"], "src": "https://youtu.be/UTTeXZrpMR0", "tEn": "Jeff Dean on AI: From Neural Nets to Gemini", "tZh": "Jeff Dean 谈 AI：从神经网络到 Gemini", "addedAt": "2026-07-05"}, {"id": "dario-dwarkesh", "pid": "dario", "pod": {"en": "Dwarkesh Podcast", "zh": "Dwarkesh 播客"}, "date": "2026-02-13", "min": 142, "fields": ["nlp", "rl"], "real": true, "src": "https://youtu.be/n1E9IZfvGMA", "tEn": "We are near the end of the exponential", "tZh": "我们已接近指数曲线的尽头", "quotes": [{"en": "The most surprising thing has been the lack of public recognition of how close we are to the end of the exponential.", "zh": "最令人惊讶的是，公众没有意识到我们离指数增长的终点有多近。"}, {"en": "All the cleverness, all the techniques... doesn't matter very much. There only a few things that matter.", "zh": "所有的聪明才智、所有技巧……都不太重要。只有少数几件事重要。"}, {"en": "We're seeing the same scaling in RL that we saw for pre-training.", "zh": "我们在强化学习中看到了与预训练相同的 Scaling。"}], "addedAt": "2026-06-17"}, {"id": "ryanstephen-diveclub-2026", "pid": "ryanstephen", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-02-12", "min": 40, "fields": ["product"], "src": "https://youtu.be/Eqsw9qWnjtM", "tEn": "Spatial Design Experiments: Making Ideas Feel Real", "tZh": "空间设计实验：让想法变得真实", "addedAt": "2026-08-01T10:47:53Z", "reingestedAt": "2026-08-02T06:47:51Z"}, {"id": "sherwinwu-lennyspo-2026", "pid": "sherwinwu", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2026-02-12", "min": 80, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/B26CwKm5C1k", "tEn": "95% of OpenAI engineers use Codex, 100% PRs reviewed by AI", "tZh": "OpenAI 内部：95%工程师用 Codex 写代码，100%PR 由 AI 审查", "addedAt": "2026-07-14T13:45:46Z"}, {"id": "lecun-offcall-2026", "pid": "lecun", "pod": {"en": "Offcall", "zh": "Offcall 播客"}, "date": "2026-02-12", "min": 35, "fields": ["deep-learning", "bio"], "src": "https://youtu.be/wsP2f65pcVI", "tEn": "World Models vs. LLMs: The Next Phase of AI in Healthcare", "tZh": "世界模型 vs. 大语言模型：医疗 AI 的下一个阶段", "addedAt": "2026-07-02"}, {"id": "suleyman-financia-2026", "pid": "suleyman", "pod": {"en": "Financial Times", "zh": "金融时报"}, "date": "2026-02-12", "min": 21, "fields": ["safety", "deep-learning"], "src": "https://youtu.be/YTrBz6Z5c0E", "tEn": "Is AI a Bubble? Mustafa Suleyman on Superintelligence and Microsoft's Strategy", "tZh": "AI 是泡沫吗？穆斯塔法·苏莱曼谈超级智能与微软战略", "addedAt": "2026-07-02"}, {"id": "dario-interest", "pid": "dario", "pod": {"en": "Interesting Times", "zh": "Interesting Times"}, "date": "2026-02-12", "min": 63, "fields": ["nlp", "safety"], "src": "https://youtu.be/N5JDzS9MQYI", "tEn": "‘We don’t know if the models are conscious’", "tZh": "「我们不知道模型是否有意识」", "addedAt": "2026-06-17"}, {"id": "steinberger-lexfridm-2026", "pid": "steinberger", "pod": {"en": "Lex Fridman Podcast", "zh": "Lex Fridman 播客"}, "date": "2026-02-12", "min": 196, "fields": ["nlp"], "src": "https://youtu.be/YFjfBk8HI5o", "tEn": "The Open Claw Moment: AI Agent Revolution with Peter Steinberger", "tZh": "Open Claw 时刻：与 Peter Steinberger 探讨 AI 代理革命", "addedAt": "2026-06-17"}, {"id": "jimfan-radicalv-2026", "pid": "jimfan", "pod": {"en": "Radical Ventures", "zh": "Radical Ventures"}, "date": "2026-02-11", "min": 45, "fields": ["robotics", "deep-learning"], "src": "https://youtu.be/Hg5-aKXZii0", "tEn": "Inside NVIDIA's Jim Fan: From OpenAI Intern to Embodied AI Pioneer", "tZh": "NVIDIA Jim Fan 专访：从 OpenAI 实习生到具身智能先驱", "addedAt": "2026-08-17T03:37:20Z"}, {"id": "hannahhearth-diveclub-2026", "pid": "hannahhearth", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-02-09", "min": 51, "fields": ["product"], "src": "https://youtu.be/K9qdl3M5NgE", "tEn": "Design Leadership in the Age of AI", "tZh": "AI 时代的设计领导力", "addedAt": "2026-08-01T10:36:59Z", "reingestedAt": "2026-08-02T07:43:59Z"}, {"id": "lambert-turingpo-2026", "pid": "lambert", "pod": {"en": "Turing Post", "zh": "Turing Post"}, "date": "2026-02-06", "min": 47, "fields": ["nlp"], "src": "https://youtu.be/mq_V6zAjsSI", "tEn": "Open Models as the Engine for the Next Decade of AI Research", "tZh": "开放模型：未来十年 AI 研究的引擎", "addedAt": "2026-06-17"}, {"id": "carinahong-gradient-2026", "pid": "carinahong", "pod": {"en": "Gradient Dissent", "zh": "Gradient Dissent"}, "date": "2026-02-05", "min": 51, "fields": ["deep-learning"], "src": "https://youtu.be/QxfsjDBDw3M", "tEn": "Axiom Math: Building a Self-Improving Reasoning Engine with AI Mathematician", "tZh": "Axiom Math：构建自我改进的推理引擎与 AI 数学家", "addedAt": "2026-07-14T15:09:42Z"}, {"id": "elon-dwarkesh-2026", "pid": "elon", "pod": {"en": "Dwarkesh Podcast", "zh": "Dwarkesh 播客"}, "date": "2026-02-05", "min": 170, "fields": ["deep-learning", "product"], "src": "https://youtu.be/BYXbuik3dgA", "tEn": "Why AI Data Centers Will Move to Space in 36 Months", "tZh": "为什么 AI 数据中心将在 36 个月内搬到太空", "addedAt": "2026-06-17"}, {"id": "sholto-tbpn-2026", "pid": "sholto", "pod": {"en": "TBPN", "zh": "TBPN"}, "date": "2026-02-05", "min": 196, "fields": ["product", "nlp"], "src": "https://youtu.be/rMZ3dnduL4k", "tEn": "Anthropic's Super Bowl Ads: A Blue Shell Attack on OpenAI?", "tZh": "Anthropic 的超级碗广告：针对 OpenAI 的蓝龟壳攻击？", "addedAt": "2026-06-17"}, {"id": "karlkoch-diveclub-2026", "pid": "karlkoch", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-02-04", "min": 46, "fields": ["product"], "src": "https://youtu.be/7_VEb9iDW2c", "tEn": "Level Up as a New Design Engineer with AI Tactics", "tZh": "新晋设计工程师如何利用 AI 策略提升自己", "addedAt": "2026-07-21T15:09:14Z"}, {"id": "lambert-lexfridm-2026", "pid": "lambert", "pod": {"en": "Lex Fridman Podcast", "zh": "Lex Fridman 播客"}, "date": "2026-01-31", "min": 265, "fields": ["nlp", "rl"], "src": "https://youtu.be/EV7WhVT270Q", "tEn": "AI State of the Art: DeepSeek, Claude Opus 4.5, and the Global Race", "tZh": "AI 前沿：DeepSeek、Claude Opus 4.5 与全球竞赛", "addedAt": "2026-07-02"}, {"id": "andreessen-lennyspo-2026", "pid": "andreessen", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2026-01-29", "min": 105, "fields": ["deep-learning"], "src": "https://youtu.be/87Pm0SGTtN8", "tEn": "AI and the Future of Work: A Conversation with Marc Andreessen", "tZh": "AI 与工作的未来：与马克·安德森的对谈", "addedAt": "2026-07-14T13:48:26Z"}, {"id": "naval-ericjorg-2026", "pid": "naval", "pod": {"en": "Eric Jorgenson", "zh": "Eric Jorgenson"}, "date": "2026-01-29", "min": 215, "fields": ["product"], "src": "https://youtu.be/3TafDme-GCc", "tEn": "Naval on Wealth: From Assets to Knowledge", "tZh": "纳瓦尔论财富：从资产到知识", "addedAt": "2026-07-12T07:25:28Z"}, {"id": "tworek-unsuperv-2026", "pid": "tworek", "pod": {"en": "Unsupervised Learning", "zh": "Unsupervised Learning"}, "date": "2026-01-29", "min": 63, "fields": ["rl", "deep-learning"], "src": "https://youtu.be/XtPZGVpbzOE", "tEn": "Scaling AI: Pre-training and RL", "tZh": "AI 规模扩展：预训练与强化学习", "addedAt": "2026-07-07T00:02:00Z"}, {"id": "yejin-thetwiml-2026", "pid": "yejin", "pod": {"en": "The TWIML AI Podcast", "zh": "TWIML AI 播客"}, "date": "2026-01-29", "min": 66, "fields": ["nlp"], "src": "https://youtu.be/-_x7lhhZK7M", "tEn": "Democratizing AI: The Case for Small Language Models", "tZh": "AI 民主化：小型语言模型的必要性", "addedAt": "2026-07-03"}, {"id": "fadell-newcomer-2026", "pid": "fadell", "pod": {"en": "Newcomer", "zh": "Newcomer"}, "date": "2026-01-28", "min": 64, "fields": ["deep-learning", "product"], "src": "https://youtu.be/CWdCys0cn2s", "tEn": "Tony Fadell on AI Devices, Apple's Future, and OpenAI's Strategy", "tZh": "托尼·法德尔谈 AI 设备、苹果未来与 OpenAI 策略", "addedAt": "2026-07-19T09:53:19Z"}, {"id": "dario-axios-2026", "pid": "dario", "pod": {"en": "Axios", "zh": "Axios 幕后"}, "date": "2026-01-27", "min": 14, "fields": ["safety"], "src": "https://youtu.be/zeduU9BWHD0", "tEn": "Anthropic CEO Dario Amodei: Humanity Needs to Wake Up to AI Risks", "tZh": "Anthropic CEO Dario Amodei：人类需要觉醒面对 AI 风险", "addedAt": "2026-07-01"}, {"id": "demis-bigtechn-2026", "pid": "demis", "pod": {"en": "Big Technology", "zh": "Big Technology 播客"}, "date": "2026-01-23", "min": 34, "fields": ["deep-learning", "safety"], "src": "https://youtu.be/bgBfobN2A7A", "tEn": "From LLMs to AGI: Google DeepMind CEO on Progress, Limitations, and Breakthroughs", "tZh": "从大语言模型到通用人工智能：谷歌 DeepMind CEO 谈进展、局限与突破", "addedAt": "2026-07-02"}, {"id": "sutton-acmbytec-2026", "pid": "sutton", "pod": {"en": "ACM ByteCast", "zh": "ACM ByteCast"}, "date": "2026-01-22", "min": 43, "fields": ["rl"], "src": "https://youtu.be/PI0QJr3se_U", "tEn": "Reinforcement Learning: From Trial and Error to AI's Foundation", "tZh": "强化学习：从试错到人工智能的基石", "addedAt": "2026-07-05"}, {"id": "andrewng-theecono-2026", "pid": "andrewng", "pod": {"en": "The Economic Times", "zh": "经济时报"}, "date": "2026-01-22", "min": 30, "fields": ["deep-learning", "nlp"], "src": "https://youtu.be/LnL5MXqueYQ", "tEn": "Andrew Ng on AI's Impact: Don't Hire Engineers Without AI Skills", "tZh": "吴恩达谈 AI 影响：不雇佣不懂 AI 的工程师", "addedAt": "2026-06-17"}, {"id": "garrytan-outofoff-2026", "pid": "garrytan", "pod": {"en": "Out Of Office Podcast", "zh": "Out Of Office 播客"}, "date": "2026-01-22", "min": 57, "fields": ["product"], "src": "https://youtu.be/Bl0JTCEs7r4", "tEn": "Gary Tan on San Francisco, Tech, and YC", "tZh": "Gary Tan 谈旧金山、科技与 YC", "addedAt": "2026-08-16T09:35:10Z"}, {"id": "mattsellers-diveclub-2026", "pid": "mattsellers", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-01-21", "min": 33, "fields": ["product"], "src": "https://youtu.be/hI1vsPhHAFs", "tEn": "Crafting a Portfolio That Gets You Hired at Top Startups", "tZh": "打造让你入职顶尖初创公司的作品集", "addedAt": "2026-08-01T10:54:02Z", "reingestedAt": "2026-08-02T07:00:52Z"}, {"id": "dario-bloomber-2026b", "pid": "dario", "pod": {"en": "Bloomberg Live", "zh": "彭博 Live"}, "date": "2026-01-20", "min": 25, "fields": ["deep-learning", "safety"], "src": "https://youtu.be/Ckt1cj0xjRM", "tEn": "AI Industry Status: Exponential Growth, Not AGI", "tZh": "AI 行业现状：指数级增长，而非通用人工智能", "addedAt": "2026-07-05"}, {"id": "dario-wsjatdav-2026", "pid": "dario", "pod": {"en": "WSJ at Davos", "zh": "华尔街日报·达沃斯论坛"}, "date": "2026-01-20", "min": 32, "fields": ["safety"], "src": "https://youtu.be/K7F6ohcBJus", "tEn": "AI's Dual Impact: Dario Amodei on Productivity and Job Displacement", "tZh": "AI 的双重影响：Dario Amodei 谈生产力与就业替代", "addedAt": "2026-07-01"}, {"id": "mensch-bigtechn", "pid": "mensch", "pod": {"en": "Big Technology", "zh": "Big Technology 播客"}, "date": "2026-01-16", "min": 54, "fields": ["nlp"], "src": "https://youtu.be/xxUTdyEDpbU", "tEn": "AI Model Commoditization and the Future of the Industry with Mistral CEO", "tZh": "AI 模型商品化与行业未来：Mistral CEO 访谈", "addedAt": "2026-06-17"}, {"id": "hafner-buzzrobo-2026", "pid": "hafner", "pod": {"en": "BuzzRobot", "zh": "BuzzRobot"}, "date": "2026-01-15", "min": 39, "fields": ["rl", "deep-learning"], "src": "https://youtu.be/OzVC6pT2TBI", "tEn": "Pathways to AGI: Architecture, Compute, and Beyond LLMs", "tZh": "通往 AGI 的路径：架构、计算与超越大语言模型", "addedAt": "2026-07-05"}, {"id": "carlpei-thegener-2026", "pid": "carlpei", "pod": {"en": "The Generalist", "zh": "The Generalist"}, "date": "2026-01-13", "min": 79, "fields": ["product"], "src": "https://youtu.be/N_UGz_nS83A", "tEn": "Nothing: Making Tech Fun Again", "tZh": "Nothing：让科技重拾乐趣", "addedAt": "2026-08-14T09:17:14Z"}, {"id": "henrymodisett-diveclub-2026", "pid": "henrymodisett", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2026-01-09", "min": 48, "fields": ["product"], "src": "https://youtu.be/Vt3oTBvx7xw", "tEn": "Perplexity's Design Culture: Attracting Top Talent Through Brand Storytelling", "tZh": "Perplexity 的设计文化：通过品牌故事吸引顶尖人才", "addedAt": "2026-07-21T08:29:12Z"}, {"id": "rudin-thetwiml-2026", "pid": "rudin", "pod": {"en": "The TWIML AI Podcast", "zh": "TWIML AI 播客"}, "date": "2026-01-08", "min": 66, "fields": ["robotics", "rl"], "src": "https://youtu.be/346Enb7CUfQ", "tEn": "The Gap Between Robotics Demos and Real-World Value", "tZh": "机器人演示与现实价值之间的差距", "addedAt": "2026-07-14T15:03:07Z"}, {"id": "elon-moonshot-2026", "pid": "elon", "pod": {"en": "Moonshots with Peter Diamandis", "zh": "Moonshots（彼得·戴曼迪斯）"}, "date": "2026-01-06", "min": 172, "fields": ["deep-learning", "robotics"], "src": "https://youtu.be/RSNuB9pj9P8", "tEn": "Navigating the AI Tsunami: From Star Trek to Terminator", "tZh": "驾驭 AI 海啸：从星际迷航到终结者", "addedAt": "2026-07-02"}, {"id": "springenberg-training-2026", "pid": "springenberg", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2026-01-06", "min": 62, "fields": ["robotics", "rl"], "src": "https://youtu.be/OJCT-HGxPjk", "tEn": "Building Foundation Models for Robotics with Physical Intelligence", "tZh": "与 Physical Intelligence 共话机器人基础模型构建", "addedAt": "2026-06-27"}, {"id": "fiona-thepeter-2026", "pid": "fiona", "pod": {"en": "The Peterman Pod", "zh": "Peterman 播客"}, "date": "2026-01-04", "min": 30, "fields": ["nlp"], "src": "https://youtu.be/b5-d8u-c99s", "tEn": "From Microsoft to Meta: Leadership Lessons in Speed, War Rooms, and Trust", "tZh": "从微软到 Meta：速度、作战室与信任的领导力课", "addedAt": "2026-07-03"}, {"id": "jennywen-hatchcon-2025", "pid": "jennywen", "pod": {"en": "Hatch Conference", "zh": "Hatch 大会"}, "date": "2025-12-29", "min": 25, "fields": ["product"], "src": "https://youtu.be/4u94juYwLLM", "tEn": "Rethinking the Design Process in the Age of AI", "tZh": "AI 时代重新思考设计流程", "addedAt": "2026-08-16T09:24:23Z"}, {"id": "nadchishtie-diveclub-2025b", "pid": "nadchishtie", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2025-12-19", "min": 59, "fields": ["product"], "src": "https://youtu.be/gjMHgG0-pig", "tEn": "How to Get Hired as a Designer at Lovable", "tZh": "如何在 Lovable 获得设计师职位", "addedAt": "2026-07-21T08:31:00Z"}, {"id": "bengio-thediary", "pid": "bengio", "pod": {"en": "The Diary Of A CEO", "zh": "The Diary Of A CEO"}, "date": "2025-12-18", "min": 100, "fields": ["deep-learning", "safety"], "src": "https://youtu.be/zQ1POHiR8m8", "tEn": "We have two years before everything changes", "tZh": "在一切改变之前，我们还有两年", "addedAt": "2026-06-17"}, {"id": "altman-bigtechn", "pid": "altman", "pod": {"en": "Big Technology", "zh": "Big Technology 播客"}, "date": "2025-12-18", "min": 58, "fields": ["nlp", "safety"], "src": "https://youtu.be/2P27Ef-LLuQ", "tEn": "How OpenAI wins, and ChatGPT’s future", "tZh": "OpenAI 如何取胜，以及 ChatGPT 的未来", "addedAt": "2026-06-17"}, {"id": "chowdhery-thetwiml-2025", "pid": "chowdhery", "pod": {"en": "The TWIML AI Podcast", "zh": "TWIML AI 播客"}, "date": "2025-12-17", "min": 52, "fields": ["deep-learning", "nlp"], "src": "https://youtu.be/jflz6jHMaMc", "tEn": "Rethinking Pre-training for Agentic AI", "tZh": "重新思考面向智能体 AI 的预训练", "addedAt": "2026-07-14T14:59:00Z"}, {"id": "suleyman-moonshot-2025", "pid": "suleyman", "pod": {"en": "Moonshots with Peter Diamandis", "zh": "Moonshots（彼得·戴曼迪斯）"}, "date": "2025-12-16", "min": 85, "fields": ["safety", "deep-learning"], "src": "https://youtu.be/XWGnWcmns_M", "tEn": "From OS to AI Agents: Mustafa Suleyman on Microsoft's Paradigm Shift", "tZh": "从操作系统到 AI 代理：穆斯塔法·苏莱曼谈微软的范式转变", "addedAt": "2026-07-02"}, {"id": "demis-googlede-2025", "pid": "demis", "pod": {"en": "Google DeepMind", "zh": "Google DeepMind"}, "date": "2025-12-16", "min": 56, "fields": ["deep-learning", "rl"], "src": "https://youtu.be/PqVbypvxDto", "tEn": "From Scaling to Innovation: The Path to AGI", "tZh": "从规模到创新：通往 AGI 之路", "addedAt": "2026-06-17"}, {"id": "romantesliuk-diveclub-2025", "pid": "romantesliuk", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2025-12-15", "min": 55, "fields": ["deep-learning", "product"], "src": "https://youtu.be/-G-TAriCkuk", "tEn": "Owning Web Design at ElevenLabs: From Cymatic Patterns to Brand Identity", "tZh": "主导 ElevenLabs 网页设计：从克拉尼图案到品牌标识", "addedAt": "2026-07-16T03:14:50Z"}, {"id": "boris-ryanpete-2025", "pid": "boris", "pod": {"en": "Ryan Peterman", "zh": "Ryan Peterman"}, "date": "2025-12-15", "min": 85, "fields": ["nlp"], "src": "https://youtu.be/AmdLVWMdjOk", "tEn": "Boris Cherny: From Meta to Claude Code, Building Products with Generalists", "tZh": "Boris Cherny：从 Meta 到 Claude Code，用通才思维打造产品", "addedAt": "2026-07-12T07:20:36Z"}, {"id": "edwinchen-unsuperv-2025", "pid": "edwinchen", "pod": {"en": "Unsupervised Learning", "zh": "Unsupervised Learning"}, "date": "2025-12-15", "min": 48, "fields": ["nlp"], "src": "https://youtu.be/FiskCZddREA", "tEn": "The Pitfalls of Bad Benchmarks in AI Models", "tZh": "AI 模型不良基准的陷阱", "addedAt": "2026-07-12T03:56:11Z"}, {"id": "lecun-theinfor-2025", "pid": "lecun", "pod": {"en": "The Information Bottleneck", "zh": "The Information Bottleneck"}, "date": "2025-12-15", "min": 110, "fields": ["deep-learning"], "src": "https://youtu.be/7u-DXVADyhc", "tEn": "Yann LeCun on Starting AMI: Open Research and World Models", "tZh": "杨立昆谈创办 AMI：开放研究与世界模型", "addedAt": "2026-06-17"}, {"id": "suleyman-bloomber", "pid": "suleyman", "pod": {"en": "Bloomberg Podcasts", "zh": "彭博播客"}, "date": "2025-12-12", "min": 48, "fields": ["nlp", "safety"], "src": "https://youtu.be/MUEKVoeeRoA", "tEn": "On superintelligence and the Microsoft–OpenAI deal", "tZh": "谈超级智能与微软–OpenAI 交易", "addedAt": "2026-06-17"}, {"id": "davidsp-anthropi-2025", "pid": "davidsp", "pod": {"en": "Anthropic", "zh": "Anthropic 官方"}, "date": "2025-12-11", "min": 36, "fields": ["nlp"], "src": "https://youtu.be/PLyCki2K0Lg", "tEn": "Anthropic Donates MCP to Linux Foundation: Standardizing AI-Application Connections", "tZh": "Anthropic 将 MCP 捐赠给 Linux 基金会：标准化 AI 与应用的连接", "addedAt": "2026-07-04"}, {"id": "yejin-laudeins-2025", "pid": "yejin", "pod": {"en": "Laude Institute", "zh": "Laude 研究院"}, "date": "2025-12-11", "min": 22, "fields": ["nlp", "safety"], "src": "https://youtu.be/aiRro-oN5KA", "tEn": "AI's Data Hunger: From Internet to Synthetic Data and the Quest for True Knowledge", "tZh": "AI 的数据饥渴：从互联网到合成数据，再到真正知识的探索", "addedAt": "2026-07-03"}, {"id": "shanelegg-googlede-2025", "pid": "shanelegg", "pod": {"en": "Google DeepMind", "zh": "Google DeepMind"}, "date": "2025-12-11", "min": 53, "fields": ["safety", "deep-learning"], "src": "https://youtu.be/l3u_FAv33G0", "tEn": "Human Intelligence vs. Superintelligence: The Future of AGI", "tZh": "人类智能与超级智能：AGI 的未来", "addedAt": "2026-06-23"}, {"id": "godement-unsuperv-2025", "pid": "godement", "pod": {"en": "Unsupervised Learning", "zh": "Unsupervised Learning"}, "date": "2025-12-10", "min": 58, "fields": ["nlp", "product"], "src": "https://youtu.be/8y6wJ-_FMSY", "tEn": "2025: The Year of Enterprise Coding", "tZh": "2025：企业编码之年", "addedAt": "2026-07-14T15:13:59Z"}, {"id": "feifei-thetimfe-2025", "pid": "feifei", "pod": {"en": "The Tim Ferriss Show", "zh": "蒂姆·费里斯秀"}, "date": "2025-12-09", "min": 70, "fields": ["deep-learning"], "src": "https://youtu.be/z1g1kkA1M-8", "tEn": "The Importance of Learning Ability Over Degrees in the AI Era", "tZh": "AI 时代学习能力比学历更重要", "addedAt": "2026-07-02"}, {"id": "edwinchen-lennyspo-2025", "pid": "edwinchen", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2025-12-07", "min": 71, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/dduQeaqmpnI", "tEn": "From Zero to a Billion: The Surge AI Story", "tZh": "从零到十亿：Surge AI 的传奇故事", "addedAt": "2026-08-02T07:56:04Z"}, {"id": "askell-anthropi-2025", "pid": "askell", "pod": {"en": "Anthropic", "zh": "Anthropic 官方"}, "date": "2025-12-05", "min": 36, "fields": ["safety"], "src": "https://youtu.be/I9aGC6Ui3eE", "tEn": "A Philosopher at Anthropic: Shaping AI Character and Ethics", "tZh": "Anthropic 的哲学家：塑造 AI 性格与伦理", "addedAt": "2026-07-04"}, {"id": "jensen-thejoero-2025", "pid": "jensen", "pod": {"en": "The Joe Rogan Experience", "zh": "The Joe Rogan Experience"}, "date": "2025-12-03", "min": 148, "fields": ["product"], "src": "https://youtu.be/3hptKYix4X8", "tEn": "Joe Rogan and Jensen Huang Discuss Trump, SpaceX, and Common Sense", "tZh": "Joe Rogan 与黄仁勋畅谈特朗普、SpaceX 与常识", "addedAt": "2026-07-12T07:22:22Z"}, {"id": "diannepenn-unsuperv-2025", "pid": "diannepenn", "pod": {"en": "Unsupervised Learning", "zh": "Unsupervised Learning"}, "date": "2025-12-02", "min": 42, "fields": ["nlp", "product"], "src": "https://youtu.be/V5gTVTCtC6Y", "tEn": "Opus 4.5: Deep Dive into Anthropic's Research and Product Strategy", "tZh": "Opus 4.5：深入探讨 Anthropic 的研究与产品策略", "addedAt": "2026-07-14T15:16:07Z"}, {"id": "steveruiz-diveclub-2025", "pid": "steveruiz", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2025-12-01", "min": 63, "fields": ["deep-learning", "product"], "src": "https://youtu.be/3SvL0r-Lhh8", "tEn": "The Infinite Canvas: A Pivotal Interface for AI Collaboration", "tZh": "无限画布：AI 协作的关键界面", "addedAt": "2026-07-16T03:19:06Z"}, {"id": "delangue-relentle-2025", "pid": "delangue", "pod": {"en": "Relentless", "zh": "Relentless"}, "date": "2025-12-01", "min": 108, "fields": ["nlp", "robotics"], "src": "https://youtu.be/b0iJZS9HgJA", "tEn": "Open Source AI: Democratizing Robotics with Affordable Hardware", "tZh": "开源 AI：用平价硬件让机器人技术民主化", "addedAt": "2026-06-23"}, {"id": "jumper-googlede-2025", "pid": "jumper", "pod": {"en": "Google DeepMind", "zh": "Google DeepMind"}, "date": "2025-11-28", "min": 48, "fields": ["deep-learning", "bio"], "src": "https://youtu.be/-pGs0btGmgY", "tEn": "AlphaFold: From Grand Challenge to Nobel Prize", "tZh": "AlphaFold：从世纪难题到诺贝尔奖", "addedAt": "2026-07-03"}, {"id": "andrewng-masterso-2025", "pid": "andrewng", "pod": {"en": "Masters of Scale", "zh": "Masters of Scale 峰会"}, "date": "2025-11-26", "min": 22, "fields": ["deep-learning", "nlp"], "src": "https://youtu.be/XeUAu65unu8", "tEn": "AI Pioneer Andrew Ng on Agentic Workflows and the Future of Coding", "tZh": "AI 先驱吴恩达谈智能体工作流与编程的未来", "addedAt": "2026-07-02"}, {"id": "kaiser-themadpo", "pid": "kaiser", "pod": {"en": "The MAD Podcast", "zh": "Matt Turck 的 MAD 播客"}, "date": "2025-11-26", "min": 66, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/3K-R4yVjJfU", "tEn": "Why AI Progress Isn't Slowing Down", "tZh": "AI 进步为何没有放缓", "addedAt": "2026-06-17"}, {"id": "justinjohnson-latentsp-2025", "pid": "justinjohnson", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2025-11-25", "min": 61, "fields": ["deep-learning"], "src": "https://youtu.be/60iW8FZ7MJU", "tEn": "From AlexNet to World Models: The Scaling of Compute and Spatial Intelligence", "tZh": "从 AlexNet 到世界模型：计算扩展与空间智能", "addedAt": "2026-07-05"}, {"id": "feifei-latentsp", "pid": "feifei", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2025-11-25", "min": 61, "fields": ["deep-learning"], "src": "https://youtu.be/60iW8FZ7MJU", "tEn": "After LLMs: spatial intelligence and world models", "tZh": "LLM 之后：空间智能与世界模型", "addedAt": "2026-06-17"}, {"id": "ilya-dwarkesh-2025", "pid": "ilya", "pod": {"en": "Dwarkesh Podcast", "zh": "Dwarkesh 播客"}, "date": "2025-11-25", "min": 96, "fields": ["deep-learning", "safety"], "src": "https://youtu.be/aR20FWCCjAs", "tEn": "From the age of scaling to the age of research", "tZh": "从规模的时代，到研究的时代", "addedAt": "2026-06-17"}, {"id": "emilycampbell-diveclub-2025", "pid": "emilycampbell", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2025-11-24", "min": 43, "fields": ["product"], "src": "https://youtu.be/PEDzBT-jNmI", "tEn": "Designing Great AI Experiences with Emily Campbell", "tZh": "与 Emily Campbell 一起设计出色的 AI 体验", "addedAt": "2026-07-21T15:07:07Z"}, {"id": "llion-machinel-2025", "pid": "llion", "pod": {"en": "Machine Learning Street Talk", "zh": "ML Street Talk"}, "date": "2025-11-23", "min": 73, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/DtePicx_kFY", "tEn": "From Transformer Inventor to Continuous Thought Machine: A New Path in AI", "tZh": "从 Transformer 发明者到连续思维机器：AI 研究的新路径", "addedAt": "2026-06-27"}, {"id": "feifei-bloomber-2025", "pid": "feifei", "pod": {"en": "Bloomberg Podcasts", "zh": "彭博播客"}, "date": "2025-11-21", "min": 50, "fields": ["deep-learning"], "src": "https://youtu.be/E2yzX6Gch40", "tEn": "AI's Godmother: From Physics to Spatial Intelligence", "tZh": "AI 教母：从物理到空间智能", "addedAt": "2026-06-17"}, {"id": "lambert-themadpo-2025", "pid": "lambert", "pod": {"en": "The MAD Podcast", "zh": "Matt Turck 的 MAD 播客"}, "date": "2025-11-20", "min": 88, "fields": ["nlp"], "src": "https://youtu.be/HGoQnDFHTVA", "tEn": "AI2 Launches Fully Open Almo 3 Models, Challenging Closed-Source AI", "tZh": "AI2 发布完全开放的 Almo 3 模型，挑战闭源 AI", "addedAt": "2026-07-02"}, {"id": "deviparikh-thetwiml-2025", "pid": "deviparikh", "pod": {"en": "The TWIML AI Podcast", "zh": "TWIML AI 播客"}, "date": "2025-11-18", "min": 55, "fields": ["deep-learning"], "src": "https://youtu.be/lsrNu1S8LFQ", "tEn": "The Future of Web Interaction: AI Agents and Browser Automation", "tZh": "网页交互的未来：AI 代理与浏览器自动化", "addedAt": "2026-07-14T15:01:05Z"}, {"id": "kendall-training-2025", "pid": "kendall", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2025-11-18", "min": 42, "fields": ["robotics"], "src": "https://youtu.be/8x_O8BeGNTw", "tEn": "From AV 1.0 to 2.0: The Rise of End-to-End Neural Networks in Autonomous Driving", "tZh": "从 AV 1.0 到 2.0：端到端神经网络在自动驾驶中的崛起", "addedAt": "2026-07-05"}, {"id": "andrewng-20vc", "pid": "andrewng", "pod": {"en": "20VC", "zh": "20VC 创投播客"}, "date": "2025-11-17", "min": 66, "fields": ["deep-learning", "nlp"], "src": "https://youtu.be/rT74mF6_NhQ", "tEn": "AI's Insatiable Compute Demand: Bottlenecks and Geopolitical Dynamics", "tZh": "AI 对算力的无尽需求：瓶颈与地缘政治动态", "addedAt": "2026-06-17"}, {"id": "feifei-lennyspo", "pid": "feifei", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2025-11-16", "min": 80, "fields": ["deep-learning", "robotics"], "src": "https://youtu.be/Ctjiatnd6Xk", "tEn": "Jobs, robots, and why world models are next", "tZh": "工作、机器人，以及为何世界模型是下一步", "addedAt": "2026-06-17"}, {"id": "geoffreylitt-diveclub-2025", "pid": "geoffreylitt", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2025-11-14", "min": 57, "fields": ["product", "nlp"], "src": "https://youtu.be/zJf0UeCwQqE", "tEn": "LLMs and the Future of Malleable Software", "tZh": "LLM 与可塑软件的未来", "addedAt": "2026-07-21T08:21:57Z"}, {"id": "dsilver-publicle-2025", "pid": "dsilver", "pod": {"en": "Public Lecture", "zh": "公开讲座"}, "date": "2025-11-14", "min": 46, "fields": ["rl", "deep-learning"], "src": "https://youtu.be/92HsCY8kL50", "tEn": "From Human Data to Experience: The Next Era of AI", "tZh": "从人类数据到经验：AI 的下一个时代", "addedAt": "2026-06-23"}, {"id": "carlpei-thegstaa-2025", "pid": "carlpei", "pod": {"en": "The Gstaad Guy Podcast", "zh": "Gstaad Guy 播客"}, "date": "2025-11-12", "min": 67, "fields": ["product"], "src": "https://youtu.be/o5snwOWrpmw", "tEn": "Making Tech Fun Again: Carl Pei on Nothing's Mission", "tZh": "让科技重拾乐趣：Carl Pei 谈 Nothing 的使命", "addedAt": "2026-08-16T09:22:46Z"}, {"id": "naval-naval-2025b", "pid": "naval", "pod": {"en": "Naval", "zh": "纳瓦尔播客"}, "date": "2025-11-08", "min": 52, "fields": ["deep-learning"], "src": "https://youtu.be/S8x978NnZSI", "tEn": "Why Founders Must Own Recruiting, Fundraising, Strategy, and Product Vision", "tZh": "创始人必须亲自掌控招聘、融资、战略和产品愿景", "addedAt": "2026-07-05"}, {"id": "billpeebles-unsuperv-2025", "pid": "billpeebles", "pod": {"en": "Unsupervised Learning", "zh": "Unsupervised Learning"}, "date": "2025-11-03", "min": 63, "fields": ["deep-learning"], "src": "https://youtu.be/kN04ZFJyFBk", "tEn": "Sora: The AI Video Revolution and Social Experience", "tZh": "Sora：AI 视频革命与社交体验", "addedAt": "2026-07-14T15:18:28Z"}, {"id": "altman-bg2pod-2025", "pid": "altman", "pod": {"en": "Bg2 Pod", "zh": "Bg2 Pod"}, "date": "2025-10-31", "min": 74, "fields": ["nlp"], "src": "https://youtu.be/Gnl833wXRz0", "tEn": "OpenAI and Microsoft: A Historic Tech Partnership", "tZh": "OpenAI 与微软：历史性的科技合作伙伴关系", "addedAt": "2026-07-12T08:47:44Z"}, {"id": "elon-thejoero", "pid": "elon", "pod": {"en": "The Joe Rogan Experience", "zh": "The Joe Rogan Experience"}, "date": "2025-10-31", "min": 198, "fields": ["nlp", "robotics"], "src": "https://youtu.be/O4wBUysNe2k", "tEn": "Elon Musk on AI, robots, and the future", "tZh": "埃隆·马斯克谈 AI、机器人与未来", "addedAt": "2026-06-17"}, {"id": "jasonwei-stanford-2025", "pid": "jasonwei", "pod": {"en": "Stanford AI Club", "zh": "斯坦福 AI 俱乐部"}, "date": "2025-10-18", "min": 30, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/b6Doq2fz81U", "tEn": "Intelligence as a Commodity: Three Key Trends for AI in 2025", "tZh": "智能商品化：2025 年 AI 的三个关键趋势", "addedAt": "2026-07-05"}, {"id": "karpathy-dwarkesh", "pid": "karpathy", "pod": {"en": "Dwarkesh Podcast", "zh": "Dwarkesh 播客"}, "date": "2025-10-17", "min": 146, "fields": ["nlp", "rl"], "real": true, "feat": true, "src": "https://youtu.be/lXUZvyajciY", "tEn": "We’re summoning ghosts, not building animals", "tZh": "我们在召唤幽灵，而不是在造动物", "quotes": [{"en": "We’re not building animals. We’re building ghosts — ethereal, fully digital entities that mimic humans. It’s a different kind of intelligence.", "zh": "我们造的不是动物，而是幽灵——一种缥缈的、完全数字化的存在，模仿着人类。那是一种不同的智能。"}, {"en": "Reinforcement learning is terrible. It just so happens that everything we had before is much worse.", "zh": "强化学习很糟糕。只不过恰好，我们此前拥有的一切都还要糟糕得多。"}], "addedAt": "2026-06-17"}, {"id": "dylanfield-lennyspo-2025", "pid": "dylanfield", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2025-10-16", "min": 87, "fields": ["product"], "src": "https://youtu.be/WyJV6VwEGA8", "tEn": "Dylan Field on Figma's Journey, Design Differentiation, and AI in Product Building", "tZh": "Dylan Field 谈 Figma 的历程、设计差异化与 AI 在产品构建中的作用", "addedAt": "2026-07-21T08:19:48Z"}, {"id": "tworek-themadpo-2025", "pid": "tworek", "pod": {"en": "The MAD Podcast", "zh": "Matt Turck 的 MAD 播客"}, "date": "2025-10-16", "min": 76, "fields": ["deep-learning", "rl"], "src": "https://youtu.be/RqWIvvv3SnQ", "tEn": "OpenAI's VP of Research on Reasoning, Chain of Thought, and the Future of AI", "tZh": "OpenAI 研究副总裁谈推理、思维链与 AI 未来", "addedAt": "2026-07-05"}, {"id": "carlpei-accesspo-2025", "pid": "carlpei", "pod": {"en": "ACCESS Podcast", "zh": "ACCESS 播客"}, "date": "2025-10-16", "min": 72, "fields": ["product"], "src": "https://youtu.be/62V93XW7NVc", "tEn": "The Name Game: Carl Pei on Nothing's Success", "tZh": "名字游戏：Carl Pei 谈 Nothing 的成功", "addedAt": "2026-08-16T09:21:44Z"}, {"id": "naval-naval-2025", "pid": "naval", "pod": {"en": "Naval", "zh": "纳瓦尔播客"}, "date": "2025-10-15", "min": 42, "fields": ["product"], "src": "https://youtu.be/SIkf-4r4DuU", "tEn": "Naval on Learning by Doing and Contextual Principles", "tZh": "纳瓦尔谈通过实践学习和情境化原则", "addedAt": "2026-07-05"}, {"id": "hinton-theweekl", "pid": "hinton", "pod": {"en": "The Weekly Show", "zh": "The Weekly Show"}, "date": "2025-10-09", "min": 98, "fields": ["deep-learning", "safety"], "src": "https://youtu.be/jrK3PsD3APk", "tEn": "AI: what could go wrong?", "tZh": "AI:可能会出什么错?", "addedAt": "2026-06-17"}, {"id": "brockman-matthewb-2025", "pid": "brockman", "pod": {"en": "Matthew Berman", "zh": "Matthew Berman"}, "date": "2025-10-08", "min": 44, "fields": ["nlp", "safety"], "src": "https://youtu.be/5yA4o9fSJek", "tEn": "AI's Biggest Bottleneck: Energy, Compute, and the Future of AGI", "tZh": "AI 的最大瓶颈：能源、计算与 AGI 的未来", "addedAt": "2026-06-17"}, {"id": "roozmahdavian-diveclub-2025", "pid": "roozmahdavian", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2025-10-03", "min": 56, "fields": ["product", "robotics"], "src": "https://youtu.be/nSOCY59ram8", "tEn": "Designing Neural Interfaces: From Apple Watch to Brain-Computer Interaction", "tZh": "设计神经接口：从 Apple Watch 到脑机交互", "addedAt": "2026-07-21T08:36:13Z"}, {"id": "sutton-singular-2025", "pid": "sutton", "pod": {"en": "SingularityNET (AGI-25 Conference)", "zh": "SingularityNET（AGI-25 大会）"}, "date": "2025-10-02", "min": 65, "fields": ["rl", "deep-learning"], "src": "https://youtu.be/FaE4Yod20DM", "tEn": "A Quest for a Simple General Architecture for an AI Agent", "tZh": "追寻 AI 智能体的简单通用架构", "addedAt": "2026-07-02"}, {"id": "sholto-themadpo", "pid": "sholto", "pod": {"en": "The MAD Podcast", "zh": "Matt Turck 的 MAD 播客"}, "date": "2025-10-02", "min": 70, "fields": ["nlp", "rl"], "src": "https://youtu.be/FQy4YMYFLsI", "tEn": "The AI Compute Super Cycle and the Making of Claude Sonnet 4.5", "tZh": "AI 算力超级周期与 Claude Sonnet 4.5 的诞生", "addedAt": "2026-06-17"}, {"id": "berntbornich-relentle-2025", "pid": "berntbornich", "pod": {"en": "Relentless", "zh": "Relentless"}, "date": "2025-09-28", "min": 32, "fields": ["robotics"], "src": "https://youtu.be/NmI0UipVFyM", "tEn": "Designing a Friendly Humanoid Robot: From Sci-Fi to Soft Interaction", "tZh": "设计友好的人形机器人：从科幻到柔和互动", "addedAt": "2026-08-17T03:36:12Z"}, {"id": "eschavera-diveclub-2025", "pid": "eschavera", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2025-09-26", "min": 58, "fields": ["nlp", "product"], "src": "https://youtu.be/MHcJpGYawqk", "tEn": "Designing Perplexity's AI Browser Comet from Scratch", "tZh": "从零设计 Perplexity 的 AI 浏览器 Comet", "addedAt": "2026-07-15T06:55:45Z"}, {"id": "jensen-bg2pod-2025", "pid": "jensen", "pod": {"en": "Bg2 Pod", "zh": "Bg2 Pod"}, "date": "2025-09-26", "min": 104, "fields": ["deep-learning", "product"], "src": "https://youtu.be/pE6sw_E9Gh0", "tEn": "Nvidia CEO: OpenAI Will Be the Next Multi-Trillion Dollar Hyperscaler", "tZh": "英伟达 CEO：OpenAI 将成为下一个万亿美元超大规模公司", "addedAt": "2026-07-14T01:12:20Z"}, {"id": "sutton-dwarkesh", "pid": "sutton", "pod": {"en": "Dwarkesh Podcast", "zh": "Dwarkesh 播客"}, "date": "2025-09-26", "min": 67, "fields": ["rl", "deep-learning"], "src": "https://youtu.be/21EYKqUsPfg", "tEn": "RL vs LLMs: The Core of Intelligence", "tZh": "强化学习与大语言模型：智能的核心之争", "addedAt": "2026-06-17"}, {"id": "aravind-siliconv-2025", "pid": "aravind", "pod": {"en": "Silicon Valley Girl", "zh": "硅谷女孩"}, "date": "2025-09-26", "min": 41, "fields": ["nlp"], "src": "https://youtu.be/U7PcyE0p54s", "tEn": "Perplexity CEO: Exponential Growth, Relentless Improvement, and the Future of AI", "tZh": "Perplexity CEO：指数级增长、不懈改进与 AI 的未来", "addedAt": "2026-06-17"}, {"id": "suleyman-sineadbo-2025", "pid": "suleyman", "pod": {"en": "Sinead Bovell", "zh": "Sinead Bovell"}, "date": "2025-09-25", "min": 62, "fields": ["nlp", "safety"], "src": "https://youtu.be/kKi9-hxKxVU", "tEn": "AI Consciousness Debate: The Next 18 Months", "tZh": "AI 意识之争：未来 18 个月", "addedAt": "2026-06-17"}, {"id": "carlrivera-diveclub-2025", "pid": "carlrivera", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2025-09-19", "min": 51, "fields": ["product"], "src": "https://youtu.be/YcYH5v5BPoY", "tEn": "Reimagining Shopify's Design for the AI Era", "tZh": "为 AI 时代重新构想 Shopify 的设计", "addedAt": "2026-07-21T08:27:21Z"}, {"id": "mikekrieger-siliconv-2025", "pid": "mikekrieger", "pod": {"en": "Silicon Valley Girl", "zh": "硅谷女孩"}, "date": "2025-09-19", "min": 44, "fields": ["product"], "src": "https://youtu.be/Q66gsBJnKKQ", "tEn": "From Instagram to AI: Mike Krieger on Solo Entrepreneurship", "tZh": "从 Instagram 到 AI：Mike Krieger 谈单人创业", "addedAt": "2026-08-16T09:23:47Z", "reingestedAt": "2026-08-16T09:33:10Z"}, {"id": "nanda-80000hou-2025", "pid": "nanda", "pod": {"en": "80,000 Hours", "zh": "80,000 小时"}, "date": "2025-09-15", "min": 109, "fields": ["product"], "src": "https://youtu.be/MfMq4sVJSFc", "tEn": "Maximizing Luck Surface Area: Neil Nando on Building a Career in AI", "tZh": "最大化运气表面积：尼尔·南多谈在 AI 领域建立职业生涯", "addedAt": "2026-06-27"}, {"id": "brettaylor-thelogan-2025", "pid": "brettaylor", "pod": {"en": "The Logan Bartlett Show", "zh": "The Logan Bartlett Show"}, "date": "2025-09-12", "min": 69, "fields": ["deep-learning", "nlp"], "src": "https://youtu.be/aABWOv2uMig", "tEn": "AI Agents: The New Internet Wave", "tZh": "AI 代理：新互联网浪潮", "addedAt": "2026-07-14T15:20:30Z"}, {"id": "altman-tuckerca-2025", "pid": "altman", "pod": {"en": "Tucker Carlson", "zh": "Tucker Carlson"}, "date": "2025-09-10", "min": 57, "fields": ["nlp", "safety"], "src": "https://youtu.be/5KmpT-BoVf4", "tEn": "Is AI Alive? A Conversation on Consciousness and Creation", "tZh": "AI 有生命吗？关于意识与创造的对话", "addedAt": "2026-06-17"}, {"id": "elon-allinpod-2025", "pid": "elon", "pod": {"en": "All-In Podcast", "zh": "All-In 播客"}, "date": "2025-09-10", "min": 45, "fields": ["nlp", "robotics"], "src": "https://youtu.be/qeZqZBRA-6Q", "tEn": "Optimus: The Greatest Product Ever?", "tZh": "擎天柱：有史以来最伟大的产品？", "addedAt": "2026-06-17"}, {"id": "saravienna-diveclub-2025", "pid": "saravienna", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2025-09-06", "min": 63, "fields": ["product"], "src": "https://youtu.be/Ni353KPXuzU", "tEn": "Injecting Meaning at the Heart of Brand Design", "tZh": "在品牌设计核心注入意义", "addedAt": "2026-07-21T08:25:36Z"}, {"id": "markchen-corememo-2025", "pid": "markchen", "pod": {"en": "Core Memory", "zh": "Core Memory 播客"}, "date": "2025-09-01", "min": 98, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/ZeyHBM2Y5_4", "tEn": "The AI Talent War: Soup Diplomacy and Recruiting Strategies", "tZh": "AI 人才争夺战：汤品外交与招聘策略", "addedAt": "2026-06-27"}, {"id": "scottwu-cheekypi-2025", "pid": "scottwu", "pod": {"en": "Cheeky Pint", "zh": "Cheeky Pint"}, "date": "2025-08-27", "min": 60, "fields": ["nlp"], "src": "https://youtu.be/MmKkNmnoEvw", "tEn": "From Math Prodigy to AI Pioneer: Scott Wu's Journey", "tZh": "从数学神童到 AI 先锋：Scott Wu 的成长之路", "addedAt": "2026-06-17"}, {"id": "tombrown-ycombina-2025", "pid": "tombrown", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2025-08-19", "min": 36, "fields": ["deep-learning"], "src": "https://youtu.be/JdT78t1Offo", "tEn": "From Awkward Kid to AI Co-Founder: Tom Brown's Journey", "tZh": "从尴尬少年到 AI 联合创始人：汤姆·布朗的旅程", "addedAt": "2026-07-05"}, {"id": "jackph-thetwiml-2025", "pid": "jackph", "pod": {"en": "The TWIML AI Podcast", "zh": "TWIML AI 播客"}, "date": "2025-08-19", "min": 61, "fields": ["deep-learning"], "src": "https://youtu.be/1igh4oas1Ls", "tEn": "Genie 3: A 100x Leap in World Models", "tZh": "Genie 3：世界模型的百倍飞跃", "addedAt": "2026-06-27"}, {"id": "hendrycks-machinel-2025", "pid": "hendrycks", "pod": {"en": "Machine Learning Street Talk", "zh": "ML Street Talk"}, "date": "2025-08-13", "min": 106, "fields": ["safety"], "src": "https://youtu.be/PM1waDBNDhw", "tEn": "Super Intelligence Strategy: Beyond Humanity's Last Exam", "tZh": "超级智能战略：超越人类最后的考试", "addedAt": "2026-06-27"}, {"id": "turley-lennyspo-2025", "pid": "turley", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2025-08-09", "min": 96, "fields": ["nlp", "product"], "src": "https://youtu.be/ixY2PvQJ0To", "tEn": "From Dropbox to ChatGPT: Inside OpenAI's Product Revolution", "tZh": "从 Dropbox 到 ChatGPT：OpenAI 产品革命内幕", "addedAt": "2026-08-02T07:49:05Z"}, {"id": "vitalyfriedman-diveclub-2025", "pid": "vitalyfriedman", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2025-08-08", "min": 57, "fields": ["product"], "src": "https://youtu.be/C19H4QimihM", "tEn": "Rethinking AI Interaction: From Text Boxes to Better Design", "tZh": "重新思考 AI 交互：从文本框到更好的设计", "addedAt": "2026-07-21T08:34:22Z"}, {"id": "altman-hugeiftr", "pid": "altman", "pod": {"en": "Huge If True", "zh": "Huge If True"}, "date": "2025-08-08", "min": 65, "fields": ["nlp", "safety"], "src": "https://youtu.be/hmtuvNfytjM", "tEn": "Sam Altman shows off GPT-5 — and what’s next", "tZh": "奥尔特曼展示 GPT-5——以及接下来是什么", "addedAt": "2026-06-17"}, {"id": "dario-cheekypi", "pid": "dario", "pod": {"en": "Cheeky Pint", "zh": "Cheeky Pint"}, "date": "2025-08-06", "min": 63, "fields": ["nlp", "safety"], "src": "https://youtu.be/GcqQ1ebBqkc", "tEn": "A cheeky pint with Dario Amodei", "tZh": "与达里奥·阿莫迪小酌一杯", "addedAt": "2026-06-17"}, {"id": "pietroschirano-diveclub-2025", "pid": "pietroschirano", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2025-08-01", "min": 61, "fields": ["product"], "src": "https://youtu.be/Eqvgx_9RcW8", "tEn": "The Future of Design Workflows: Mastering AI as a Collaborator", "tZh": "设计工作流的未来：掌握 AI 作为协作伙伴", "addedAt": "2026-07-21T08:23:47Z"}, {"id": "brettaylor-lennyspo-2025", "pid": "brettaylor", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2025-07-31", "min": 89, "fields": ["nlp", "product"], "src": "https://youtu.be/qImgGtnNbx0", "tEn": "AI Market Trends and Lessons from a Legendary Builder", "tZh": "AI 市场趋势与传奇建造者的经验教训", "addedAt": "2026-08-02T07:53:32Z"}, {"id": "erikschluntz-anthropi-2025", "pid": "erikschluntz", "pod": {"en": "Anthropic", "zh": "Anthropic 官方"}, "date": "2025-07-31", "min": 31, "fields": ["product", "nlp"], "src": "https://youtu.be/fHWFF_pnqDk", "tEn": "Vibe Coding in Production: Responsible AI Code Generation", "tZh": "生产环境中的氛围编程：负责任的 AI 代码生成", "addedAt": "2026-07-20T07:26:38Z"}, {"id": "pachocki-beforeag-2025", "pid": "pachocki", "pod": {"en": "Before AGI", "zh": "Before AGI"}, "date": "2025-07-31", "min": 66, "fields": ["nlp", "rl"], "src": "https://youtu.be/LauSf7HoxwM", "tEn": "The Power Duo Behind OpenAI: From High School to AI Frontiers", "tZh": "OpenAI 背后的黄金搭档：从高中到 AI 前沿", "addedAt": "2026-06-23"}, {"id": "lambert-intercon", "pid": "lambert", "pod": {"en": "Interconnects", "zh": "Interconnects"}, "date": "2025-07-31", "min": 79, "fields": ["rl", "nlp"], "src": "https://youtu.be/PAz_-xPJcRM", "tEn": "Post-Training Recipes and RLVR with Nathan Lambert", "tZh": "后训练配方与 RLVR：对话 Nathan Lambert", "addedAt": "2026-06-17"}, {"id": "jumper-agentsof-2025", "pid": "jumper", "pod": {"en": "Agents of Tech", "zh": "Agents of Tech 播客"}, "date": "2025-07-30", "min": 38, "fields": ["deep-learning", "bio"], "src": "https://youtu.be/SyF1HEZChOM", "tEn": "AlphaFold, Nobel Prize, and the Future of AI in Biology", "tZh": "AlphaFold、诺贝尔奖与 AI 在生物学中的未来", "addedAt": "2026-07-03"}, {"id": "noambrown-sequoiac-2025", "pid": "noambrown", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2025-07-30", "min": 30, "fields": ["rl", "nlp"], "src": "https://youtu.be/EEIPtofVe2Q", "tEn": "OpenAI's IMO Gold: The Trio Behind the Breakthrough", "tZh": "OpenAI 的 IMO 金牌：突破背后的三人组", "addedAt": "2026-07-02"}, {"id": "dario-bigtechn-2025", "pid": "dario", "pod": {"en": "Big Technology", "zh": "Big Technology 播客"}, "date": "2025-07-30", "min": 69, "fields": ["safety", "deep-learning"], "src": "https://youtu.be/mYDSSRS-B5U", "tEn": "Anthropic CEO Dario Amodei on AI's Urgency and Misunderstood Warnings", "tZh": "Anthropic CEO Dario Amodei 谈 AI 的紧迫性与被误解的警告", "addedAt": "2026-07-01"}, {"id": "kaplan-ycombina-2025", "pid": "kaplan", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2025-07-29", "min": 41, "fields": ["nlp", "safety"], "src": "https://youtu.be/p8Jx4qvDoSo", "tEn": "Scaling and the Road to Human-Level AI", "tZh": "扩展与通往人类级 AI 之路", "addedAt": "2026-06-17"}, {"id": "altman-thispast-2025", "pid": "altman", "pod": {"en": "This Past Weekend", "zh": "This Past Weekend"}, "date": "2025-07-23", "min": 93, "fields": ["nlp"], "src": "https://youtu.be/aYn8VKW6vXA", "tEn": "Sam Altman on AI, Parenthood, and the Future", "tZh": "Sam Altman 谈 AI、育儿与未来", "addedAt": "2026-07-12T08:49:15Z"}, {"id": "demis-lexfridm-2025", "pid": "demis", "pod": {"en": "Lex Fridman Podcast", "zh": "Lex Fridman 播客"}, "date": "2025-07-23", "min": 148, "fields": ["deep-learning", "rl"], "src": "https://youtu.be/-HzgcbRXUK8", "tEn": "Nature's Patterns Are Efficiently Learnable by Classical AI", "tZh": "自然界的模式可被经典 AI 高效学习", "addedAt": "2026-06-17"}, {"id": "finn-ycombina-2025", "pid": "finn", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2025-07-22", "min": 45, "fields": ["robotics", "rl"], "src": "https://youtu.be/a8-QsBHoH94", "tEn": "Developing General Purpose Robots: From Data to Physical Intelligence", "tZh": "开发通用机器人：从数据到物理智能", "addedAt": "2026-06-23"}, {"id": "hinton-theroyal-2025", "pid": "hinton", "pod": {"en": "The Royal Institution", "zh": "The Royal Institution"}, "date": "2025-07-22", "min": 47, "fields": ["deep-learning", "safety"], "src": "https://youtu.be/IkdziSLYzHw", "tEn": "From Logic to Learning: The Rise of Neural Networks", "tZh": "从逻辑到学习：神经网络的崛起", "addedAt": "2026-06-17"}, {"id": "benmann-lennyspo-2025", "pid": "benmann", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2025-07-20", "min": 75, "fields": ["safety", "deep-learning"], "src": "https://youtu.be/WWoyWNhx2XU", "tEn": "The Last Invention: Ben Mann on AGI by 2028, AI Safety, and the Future of Humanity", "tZh": "最后的发明：Ben Mann 谈 2028 年 AGI、AI 安全与人类未来", "addedAt": "2026-07-04"}, {"id": "gunnargray-diveclub-2025", "pid": "gunnargray", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2025-07-18", "min": 54, "fields": ["nlp", "product"], "src": "https://youtu.be/K71v8otC11s", "tEn": "Thriving as a Generalist Designer in the Age of AI", "tZh": "在 AI 时代作为通才设计师茁壮成长", "addedAt": "2026-07-15T06:57:46Z"}, {"id": "danshipper-lennyspo-2025", "pid": "danshipper", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2025-07-17", "min": 95, "fields": ["nlp", "product"], "src": "https://youtu.be/crMrVozp_h8", "tEn": "AI's Role in Reshoring Jobs and the Future of Work", "tZh": "AI 在就业回流中的作用与工作的未来", "addedAt": "2026-08-02T07:50:33Z"}, {"id": "mensch-nexuslux-2025", "pid": "mensch", "pod": {"en": "Nexus Luxembourg", "zh": "Nexus Luxembourg"}, "date": "2025-07-14", "min": 21, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/xXyy6Jz9S_4", "tEn": "AI and the Future of Luxembourg: A Fireside Chat with the Prime Minister and Mistral AI CEO", "tZh": "AI 与卢森堡的未来：与首相和 Mistral AI CEO 的炉边谈话", "addedAt": "2026-07-02"}, {"id": "ryolu-diveclub-2025", "pid": "ryolu", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2025-07-11", "min": 57, "fields": ["nlp", "product"], "src": "https://youtu.be/dsZqOPVQTNg", "tEn": "Cursor: AI-Powered Code Editor for Designers", "tZh": "Cursor：为设计师打造的 AI 代码编辑器", "addedAt": "2026-07-15T07:06:14Z"}, {"id": "laskin-themadpo-2025", "pid": "laskin", "pod": {"en": "The MAD Podcast", "zh": "Matt Turck 的 MAD 播客"}, "date": "2025-07-01", "min": 67, "fields": ["rl", "nlp"], "src": "https://youtu.be/3tDIDy9Z-7k", "tEn": "Building Organizational Superintelligence: Misha on Reflection AI's Vision", "tZh": "构建组织超级智能：Misha 谈 Reflection AI 的愿景", "addedAt": "2026-06-27"}, {"id": "lample-latentsp-2025", "pid": "lample", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2025-07-01", "min": 54, "fields": ["nlp"], "src": "https://youtu.be/SUjA25ijcNs", "tEn": "Mistral Releases Boxtral TTS: Efficient Speech Generation with Novel Architecture", "tZh": "Mistral 发布 Boxtral TTS：新型架构实现高效语音生成", "addedAt": "2026-06-27"}, {"id": "noambrown-latentsp-2025", "pid": "noambrown", "pod": {"en": "Latent Space", "zh": "Latent Space"}, "date": "2025-06-19", "min": 78, "fields": ["rl", "nlp"], "src": "https://youtu.be/ddd4xjuJTyg", "tEn": "From Cicero to World Champion: Noam Brown on Diplomacy, AI, and the Turing Test", "tZh": "从西塞罗到世界冠军：Noam Brown 谈外交游戏、AI 与图灵测试", "addedAt": "2026-07-02"}, {"id": "karpathy-ycombina-2025", "pid": "karpathy", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2025-06-19", "min": 40, "fields": ["nlp", "rl"], "src": "https://youtu.be/LCEmiRjPEtQ", "tEn": "Software 3.0: The Era of AI Programming", "tZh": "软件 3.0：AI 编程时代", "addedAt": "2026-06-17"}, {"id": "elon-ycombina-2025", "pid": "elon", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2025-06-19", "min": 50, "fields": ["product", "deep-learning"], "src": "https://youtu.be/cFIlta1GkiE", "tEn": "Elon Musk on the Intelligence Big Bang and Building Useful Things", "tZh": "埃隆·马斯克谈智能大爆炸与创造有用之物", "addedAt": "2026-06-17"}, {"id": "altman-theopena-2025", "pid": "altman", "pod": {"en": "The OpenAI Podcast", "zh": "OpenAI 播客"}, "date": "2025-06-18", "min": 40, "fields": ["nlp"], "src": "https://youtu.be/DB9mjd-65gw", "tEn": "Sam Altman on Stargate, Parenting with ChatGPT, and the Future of AGI", "tZh": "Sam Altman 谈星际之门、用 ChatGPT 育儿以及 AGI 的未来", "addedAt": "2026-07-12T08:46:14Z"}, {"id": "awang-shawnrya-2025", "pid": "awang", "pod": {"en": "Shawn Ryan Show", "zh": "Shawn Ryan Show"}, "date": "2025-06-12", "min": 204, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/QvfCHPCeoPw", "tEn": "Alex Wang on Neuralink, AI, and the Future of Humanity", "tZh": "Alex Wang 谈 Neuralink、AI 与人类未来", "addedAt": "2026-06-17"}, {"id": "mikekrieger-lennyspo-2025", "pid": "mikekrieger", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2025-06-05", "min": 66, "fields": ["nlp", "product"], "src": "https://youtu.be/DKrBGOFs0GY", "tEn": "From Instagram to Anthropic: Mike Krieger on AI's Future", "tZh": "从 Instagram 到 Anthropic：Mike Krieger 谈 AI 的未来", "addedAt": "2026-08-02T07:57:19Z"}, {"id": "batson-stanford-2025", "pid": "batson", "pod": {"en": "Stanford Online", "zh": "斯坦福公开课"}, "date": "2025-06-05", "min": 73, "fields": ["safety"], "src": "https://youtu.be/vRQs7qfIDaU", "tEn": "On the Biology of a Large Language Model", "tZh": "大型语言模型的生物学", "addedAt": "2026-07-05"}, {"id": "feifei-nopriors-2025", "pid": "feifei", "pod": {"en": "No Priors", "zh": "No Priors 播客"}, "date": "2025-06-05", "min": 36, "fields": ["deep-learning"], "src": "https://youtu.be/C6Zm5S7JHMw", "tEn": "Why Start a Company Now? Dr. Fei-Fei Li on Spatial Intelligence", "tZh": "为何现在创办公司？李飞飞博士谈空间智能", "addedAt": "2026-07-02"}, {"id": "varun-20vc-2025", "pid": "varun", "pod": {"en": "20VC", "zh": "20VC 创投播客"}, "date": "2025-06-02", "min": 65, "fields": ["nlp"], "src": "https://youtu.be/LSuSb7NFUT8", "tEn": "Startups: Don't Fall in Love with Your Ideas", "tZh": "创业：不要爱上你的想法", "addedAt": "2026-06-23"}, {"id": "bricken-dwarkesh-2025", "pid": "bricken", "pod": {"en": "Dwarkesh Podcast", "zh": "Dwarkesh 播客"}, "date": "2025-05-22", "min": 144, "fields": ["rl", "nlp"], "src": "https://youtu.be/64lXQP6cs5M", "tEn": "RL for Language Models Finally Works: Expert Performance in Math and Code", "tZh": "语言模型的强化学习终于奏效：在数学和编程领域达到专家水平", "addedAt": "2026-07-05"}, {"id": "parada-googlede-2025", "pid": "parada", "pod": {"en": "Google DeepMind", "zh": "Google DeepMind"}, "date": "2025-05-22", "min": 46, "fields": ["robotics", "rl"], "src": "https://youtu.be/Rgwty6dGsYI", "tEn": "From Reinforcement Learning to Gemini Robotics: The Evolution of Embodied AI", "tZh": "从强化学习到 Gemini Robotics：具身智能的进化之路", "addedAt": "2026-07-05"}, {"id": "sholto-unsuperv-2025", "pid": "sholto", "pod": {"en": "Unsupervised Learning", "zh": "Unsupervised Learning"}, "date": "2025-05-22", "min": 58, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/W1aGV4K3A8Y", "tEn": "Douglas on Claude 4: Coding, Agents, and the Future of AI", "tZh": "道格拉斯谈 Claude 4：编程、智能体与 AI 未来", "addedAt": "2026-07-02"}, {"id": "sholto-dwarkesh-2025", "pid": "sholto", "pod": {"en": "Dwarkesh Podcast", "zh": "Dwarkesh 播客"}, "date": "2025-05-22", "min": 144, "fields": ["nlp", "rl"], "src": "https://youtu.be/64lXQP6cs5M", "tEn": "RL and Language Models: Progress, Agents, and Feedback Loops in 2025", "tZh": "强化学习与语言模型：2025 年的进展、智能体与反馈循环", "addedAt": "2026-06-17"}, {"id": "lipbutan-cadence-2025", "pid": "lipbutan", "pod": {"en": "Cadence", "zh": "Cadence"}, "date": "2025-05-14", "min": 50, "fields": ["deep-learning"], "src": "https://youtu.be/9tsuXcQOoaE", "tEn": "Intel CEO Lip-Bu Tan on Culture and Engineering Transformation", "tZh": "英特尔 CEO 陈立武谈文化与工程转型", "addedAt": "2026-07-19T03:36:44Z"}, {"id": "jonyive-stripese-2025", "pid": "jonyive", "pod": {"en": "Stripe Sessions", "zh": "Stripe Sessions"}, "date": "2025-05-08", "min": 59, "fields": ["product"], "src": "https://youtu.be/wLb9g_8r-mE", "tEn": "From Art School to Silicon Valley: A Conversation with Sir Johnny Ive", "tZh": "从艺术学校到硅谷：与乔尼·艾维爵士的对话", "addedAt": "2026-08-14T09:18:00Z"}, {"id": "scottwu-lennyspo-2025", "pid": "scottwu", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2025-05-04", "min": 93, "fields": ["nlp", "product"], "src": "https://youtu.be/gI0ZNhA0rvE", "tEn": "AI Engineers: The Future of Coding with Scott Wu", "tZh": "AI 工程师：与 Scott Wu 一起探讨编程的未来", "addedAt": "2026-08-02T07:52:13Z"}, {"id": "truell-lennyspo-2025", "pid": "truell", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2025-05-01", "min": 71, "fields": ["nlp", "product"], "src": "https://youtu.be/En5cSXgGvZM", "tEn": "Inventing a New Type of Programming: The Vision Behind Cursor", "tZh": "发明新型编程：Cursor 背后的愿景", "addedAt": "2026-08-02T07:54:42Z"}, {"id": "thomaswolf-training-2025", "pid": "thomaswolf", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2025-05-01", "min": 43, "fields": ["nlp", "robotics"], "src": "https://youtu.be/RFKFaJfvBqE", "tEn": "HuggingFace's Leap into Robotics: Building an Open Source Community for Physical AI", "tZh": "HuggingFace 进军机器人领域：为物理 AI 构建开源社区", "addedAt": "2026-06-27"}, {"id": "zuckerberg-dwarkesh-2025", "pid": "zuckerberg", "pod": {"en": "Dwarkesh Podcast", "zh": "Dwarkesh 播客"}, "date": "2025-04-29", "min": 76, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/rYXeQbTuVl0", "tEn": "AI Coding Agents and Open Source Models: Mark's Vision", "tZh": "AI 编程代理与开源模型：马克的愿景", "addedAt": "2026-07-19T14:43:11Z"}, {"id": "jaderberg-training-2025", "pid": "jaderberg", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2025-04-29", "min": 56, "fields": ["rl", "deep-learning", "bio"], "src": "https://youtu.be/LrMKsBtx5Bc", "tEn": "Building a General AI Drug Design Engine: From AlphaFold 3 to Superhuman Creativity", "tZh": "构建通用 AI 药物设计引擎：从 AlphaFold 3 到超人类创造力", "addedAt": "2026-06-27"}, {"id": "zuckerberg-thispast-2025", "pid": "zuckerberg", "pod": {"en": "This Past Weekend", "zh": "This Past Weekend"}, "date": "2025-04-28", "min": 98, "fields": ["deep-learning"], "src": "https://youtu.be/zbfOkhrgxH0", "tEn": "Mark Zuckerberg on Jiu-Jitsu, Coffee, and UFC", "tZh": "马克·扎克伯格谈柔术、咖啡与 UFC", "addedAt": "2026-07-19T14:47:54Z"}, {"id": "fulford-nopriors-2025", "pid": "fulford", "pod": {"en": "No Priors", "zh": "No Priors 播客"}, "date": "2025-04-24", "min": 31, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/qfB4eDkd_40", "tEn": "The Origin Story of OpenAI's Deep Research", "tZh": "OpenAI 深度研究的起源故事", "addedAt": "2026-07-05"}, {"id": "shanahan-googlede-2025", "pid": "shanahan", "pod": {"en": "Google DeepMind", "zh": "Google DeepMind"}, "date": "2025-04-24", "min": 43, "fields": ["safety", "deep-learning"], "src": "https://youtu.be/v1Py_hWcmkU", "tEn": "AI, Consciousness, and the Future of Mind", "tZh": "AI、意识与心智的未来", "addedAt": "2026-06-27"}, {"id": "tuhinkumar-diveclub-2025", "pid": "tuhinkumar", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2025-04-19", "min": 66, "fields": ["product"], "src": "https://youtu.be/nznSevwjbjE", "tEn": "Designing for Generative AI: From 0 to 1 with Luma AI's Head of Design", "tZh": "生成式 AI 设计：从 0 到 1——对话 Luma AI 设计主管", "addedAt": "2026-07-15T07:15:11Z"}, {"id": "altman-ted-2025", "pid": "altman", "pod": {"en": "TED", "zh": "TED"}, "date": "2025-04-12", "min": 48, "fields": ["nlp", "safety"], "src": "https://youtu.be/5MWT_doo68k", "tEn": "Sam Altman on AI Creativity, IP, and the Future of Work", "tZh": "Sam Altman 谈 AI 创造力、知识产权与工作未来", "addedAt": "2026-06-17"}, {"id": "lecun-aiinside-2025", "pid": "lecun", "pod": {"en": "AI Inside", "zh": "AI Inside 播客"}, "date": "2025-04-09", "min": 46, "fields": ["deep-learning"], "src": "https://youtu.be/BytuEqzQH1U", "tEn": "Yann LeCun: LLMs Less Intelligent Than a House Cat", "tZh": "Yann LeCun：LLM 的智能不如家猫", "addedAt": "2026-07-02"}, {"id": "nadchishtie-diveclub-2025", "pid": "nadchishtie", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2025-04-04", "min": 54, "fields": ["nlp", "product"], "src": "https://youtu.be/yfGuiamkgU8", "tEn": "Designing at a Rocket Ship: The First Designer at Lovable", "tZh": "火箭飞船上的设计：Lovable 的第一位设计师", "addedAt": "2026-07-15T07:08:34Z"}, {"id": "naval-modernwi-2025", "pid": "naval", "pod": {"en": "Modern Wisdom", "zh": "现代智慧"}, "date": "2025-03-31", "min": 196, "fields": ["deep-learning"], "src": "https://youtu.be/KyfUysrNaco", "tEn": "Happiness vs. Success: Two Paths to Fulfillment", "tZh": "幸福与成功：通往满足的两条路", "addedAt": "2026-07-03"}, {"id": "samstephenson-diveclub-2025", "pid": "samstephenson", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2025-03-28", "min": 51, "fields": ["nlp", "product"], "src": "https://youtu.be/306frHXyw_Y", "tEn": "Inventing the Future of AI-Assisted Work", "tZh": "发明 AI 辅助工作的未来", "addedAt": "2026-07-15T07:17:20Z"}, {"id": "evanspiegel-thediary-2025", "pid": "evanspiegel", "pod": {"en": "The Diary Of A CEO", "zh": "The Diary Of A CEO"}, "date": "2025-03-24", "min": 150, "fields": ["deep-learning", "product"], "src": "https://youtu.be/rBM6lGk4-fk", "tEn": "Evan Spiegel: From Introvert to Snapchat Billionaire", "tZh": "埃文·斯皮格尔：从内向者到 Snapchat 亿万富翁", "addedAt": "2026-07-19T14:28:41Z"}, {"id": "shazeer-unsuperv-2025", "pid": "shazeer", "pod": {"en": "Unsupervised Learning", "zh": "Unsupervised Learning"}, "date": "2025-03-17", "min": 70, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/atMRWzgHEGg", "tEn": "Gemini 3.0 Writes Gemini 4.0: AI Milestones and Test-Time Compute", "tZh": "Gemini 3.0 编写 Gemini 4.0：AI 里程碑与测试时计算", "addedAt": "2026-07-03"}, {"id": "alejandromatamala-diveclub-2025", "pid": "alejandromatamala", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2025-03-14", "min": 46, "fields": ["product"], "src": "https://youtu.be/bGIeMZ7aiuI", "tEn": "Building AI Products: Carving vs. Building", "tZh": "构建 AI 产品：雕刻而非建造", "addedAt": "2026-07-15T07:10:40Z"}, {"id": "dario-hardfork-2025", "pid": "dario", "pod": {"en": "Hard Fork", "zh": "Hard Fork"}, "date": "2025-02-28", "min": 70, "fields": ["safety", "deep-learning"], "src": "https://youtu.be/YhGUSIvsn_Y", "tEn": "AI Safety vs Accelerationism: Dario Amodei on Claude 3.7 and the Future of AI", "tZh": "AI 安全与加速主义之争：Dario Amodei 谈 Claude 3.7 与 AI 未来", "addedAt": "2026-07-12T08:43:46Z"}, {"id": "elon-thejoero-2025", "pid": "elon", "pod": {"en": "The Joe Rogan Experience", "zh": "The Joe Rogan Experience"}, "date": "2025-02-28", "min": 191, "fields": ["nlp", "product"], "src": "https://youtu.be/sSOxPJD-VNo", "tEn": "Joe Rogan and AI Grok Discuss Fort Knox, Fake News, and Unhinged AI", "tZh": "乔·罗根与 AI 格洛克讨论诺克斯堡、假新闻和失控 AI", "addedAt": "2026-07-02"}, {"id": "naval-allinpod-2025", "pid": "naval", "pod": {"en": "All-In Podcast", "zh": "All-In 播客"}, "date": "2025-02-15", "min": 110, "fields": ["product"], "src": "https://youtu.be/AI5qI6ej-yM", "tEn": "Naval Ravikant on the Secret to the All-In Podcast's Success", "tZh": "Naval Ravikant 揭秘 All-In 播客成功秘诀", "addedAt": "2026-07-03"}, {"id": "ammaarreshi-diveclub-2025", "pid": "ammaarreshi", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2025-02-14", "min": 54, "fields": ["deep-learning", "product"], "src": "https://youtu.be/1BSTZECnKT0", "tEn": "Designing with AI: Capturing Magic Without Burdening Users", "tZh": "AI 设计：捕捉魔力而不给用户增加负担", "addedAt": "2026-07-15T07:12:51Z"}, {"id": "shazeer-dwarkesh-2025", "pid": "shazeer", "pod": {"en": "Dwarkesh Podcast", "zh": "Dwarkesh 播客"}, "date": "2025-02-12", "min": 136, "fields": ["deep-learning", "nlp"], "src": "https://youtu.be/v0gjI__RyCY", "tEn": "Organizing Information: From Trillion to Clauderillion Dollar Opportunity", "tZh": "组织信息：从万亿到千万亿的机会", "addedAt": "2026-07-03"}, {"id": "karina-lennyspo-2025", "pid": "karina", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 播客"}, "date": "2025-02-09", "min": 75, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/DeskgjrLxxs", "tEn": "Building the Cutting Edge: Inside OpenAI with Karina Nguyen", "tZh": "构建前沿：与 OpenAI 的 Karina Nguyen 对话", "addedAt": "2026-07-04"}, {"id": "evanspiegel-colinand-2025", "pid": "evanspiegel", "pod": {"en": "Colin and Samir", "zh": "Colin and Samir"}, "date": "2025-02-05", "min": 70, "fields": ["deep-learning", "product"], "src": "https://youtu.be/WXEWlRxI6XM", "tEn": "Snapchat Founder Evan Spiegel on TikTok, Wearables, and Being Copied", "tZh": "Snapchat 创始人 Evan Spiegel 谈 TikTok、可穿戴设备与被抄袭", "addedAt": "2026-07-19T14:38:42Z"}, {"id": "antonoglou-training-2025", "pid": "antonoglou", "pod": {"en": "Training Data", "zh": "Training Data"}, "date": "2025-01-28", "min": 52, "fields": ["rl", "deep-learning"], "src": "https://youtu.be/6CMCkeSU9FI", "tEn": "From AlphaGo to AI Agents: Giannis on Breakthroughs in Reinforcement Learning", "tZh": "从 AlphaGo 到 AI 智能体：Giannis 谈强化学习的突破", "addedAt": "2026-07-05"}, {"id": "jensen-cleoabra-2025", "pid": "jensen", "pod": {"en": "Huge If True", "zh": "Huge If True"}, "date": "2025-01-27", "min": 63, "fields": ["deep-learning", "robotics"], "src": "https://youtu.be/7ARBJQn6QkM", "tEn": "Jensen Huang: The Vision Behind Nvidia's AI Revolution", "tZh": "黄仁勋：英伟达 AI 革命背后的愿景", "addedAt": "2026-06-17"}, {"id": "schmidhuber-machinel-2025", "pid": "schmidhuber", "pod": {"en": "Machine Learning Street Talk", "zh": "ML Street Talk"}, "date": "2025-01-16", "min": 73, "fields": ["deep-learning"], "src": "https://youtu.be/fZYUqICYCAk", "tEn": "The Most Influential Invention of the 20th Century and the AI Explosion", "tZh": "20 世纪最具影响力的发明与 AI 爆炸", "addedAt": "2026-06-17"}, {"id": "christiano-80000hou-2025", "pid": "christiano", "pod": {"en": "80,000 Hours", "zh": "80,000 小时"}, "date": "2025-01-04", "min": 132, "fields": ["safety"], "src": "https://youtu.be/GvBhe941SS8", "tEn": "Paul Christiano on AI Safety, Divestment, and Future Civilizations", "tZh": "保罗·克里斯蒂亚诺谈 AI 安全、撤资与未来文明", "addedAt": "2026-06-23"}, {"id": "awang-southpar", "pid": "awang", "pod": {"en": "South Park Commons", "zh": "South Park Commons"}, "date": "2024-12-13", "min": 56, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/CEebe451GZs", "tEn": "From Squiggle to Scale: Alex's Founder Journey", "tZh": "从迷茫到规模化：Alex 的创业之旅", "addedAt": "2026-06-17"}, {"id": "oriol-googlede-2024", "pid": "oriol", "pod": {"en": "Google DeepMind", "zh": "Google DeepMind"}, "date": "2024-12-12", "min": 52, "fields": ["nlp", "rl"], "src": "https://youtu.be/78mEYaztGaw", "tEn": "From Starcraft to Gemini: The Evolution of AI Agents", "tZh": "从星际争霸到 Gemini：AI 智能体的进化", "addedAt": "2026-06-27"}, {"id": "lambert-thecogni", "pid": "lambert", "pod": {"en": "The Cognitive Revolution", "zh": "The Cognitive Revolution"}, "date": "2024-11-21", "min": 110, "fields": ["rl", "nlp"], "src": "https://youtu.be/LVXtFnEbNU0", "tEn": "Tulu 3: Open Source Post-Training for LLMs", "tZh": "Tulu 3：大语言模型开源后训练技术", "addedAt": "2026-06-17"}, {"id": "ivyross-californ-2024", "pid": "ivyross", "pod": {"en": "California College of the Arts", "zh": "加州艺术学院"}, "date": "2024-11-12", "min": 72, "fields": ["product"], "src": "https://youtu.be/b5LgvrosPtw", "tEn": "Design, Wonder, and Imagination: A Conversation with Ivy Ross", "tZh": "设计、惊奇与想象：与艾维·罗斯的对话", "addedAt": "2026-08-14T09:39:48Z"}, {"id": "dario-lexfridm", "pid": "dario", "pod": {"en": "Lex Fridman Podcast", "zh": "Lex Fridman 播客"}, "date": "2024-11-11", "min": 315, "fields": ["nlp", "safety"], "src": "https://youtu.be/ugvHCXCOmm4", "tEn": "Scaling Laws and the Path to AGI by 2026-2027", "tZh": "扩展定律与通往 AGI 之路：2026-2027 年", "addedAt": "2026-06-17"}, {"id": "jensen-nopriors-2024", "pid": "jensen", "pod": {"en": "No Priors", "zh": "No Priors 播客"}, "date": "2024-11-07", "min": 37, "fields": ["deep-learning"], "src": "https://youtu.be/hw7EnjC68Fw", "tEn": "Nvidia's Jensen Huang on Hyper Moore's Law and the Future of AI Computing", "tZh": "英伟达黄仁勋谈超摩尔定律与 AI 计算的未来", "addedAt": "2026-07-02"}, {"id": "elon-thejoero-2024", "pid": "elon", "pod": {"en": "The Joe Rogan Experience", "zh": "The Joe Rogan Experience"}, "date": "2024-11-04", "min": 159, "fields": ["deep-learning"], "src": "https://youtu.be/7qZl_5xHoBw", "tEn": "Video Games Improve Surgical Skills: Study Shows 32% Fewer Errors", "tZh": "电子游戏提升手术技能：研究显示错误减少 32%", "addedAt": "2026-07-12T08:54:29Z"}, {"id": "joellewenstein-diveclub-2024", "pid": "joellewenstein", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2024-10-23", "min": 50, "fields": ["nlp", "product"], "src": "https://youtu.be/GgP9LEAY1PA", "tEn": "Designing for AI's Present and Future", "tZh": "为 AI 的现在和未来而设计", "addedAt": "2026-07-15T07:04:05Z"}, {"id": "kohli-googlede-2024", "pid": "kohli", "pod": {"en": "Google DeepMind", "zh": "Google DeepMind"}, "date": "2024-10-09", "min": 50, "fields": ["deep-learning", "bio"], "src": "https://youtu.be/BfDACxrdAvQ", "tEn": "AlphaFold 3: Unlocking the Structures of Life's Molecules", "tZh": "AlphaFold 3：解锁生命分子的结构", "addedAt": "2026-07-05"}, {"id": "truell-lexfridm-2024", "pid": "truell", "pod": {"en": "Lex Fridman Podcast", "zh": "Lex Fridman 播客"}, "date": "2024-10-06", "min": 149, "fields": ["nlp"], "src": "https://youtu.be/oFfVt3S51T4", "tEn": "The Future of Programming with Cursor: AI-Assisted Coding", "tZh": "Cursor 团队谈 AI 辅助编程的未来", "addedAt": "2026-06-17"}, {"id": "tridao-unsuperv-2024", "pid": "tridao", "pod": {"en": "Unsupervised Learning", "zh": "Unsupervised Learning"}, "date": "2024-10-01", "min": 59, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/xlSaoP0b90A", "tEn": "The Future of AI Hardware and Architecture with Tri Dao", "tZh": "AI 硬件与架构的未来：与 Tri Dao 对话", "addedAt": "2026-06-27"}, {"id": "zuckerberg-acquired-2024", "pid": "zuckerberg", "pod": {"en": "Acquired", "zh": "Acquired"}, "date": "2024-09-18", "min": 87, "fields": ["deep-learning"], "src": "https://youtu.be/QciJ9ubeLQk", "tEn": "Mark Zuckerberg Interview at Acquired Live: A New Era Begins", "tZh": "马克·扎克伯格在 Acquired 现场访谈：新时代开启", "addedAt": "2026-07-19T14:45:32Z"}, {"id": "karpathy-nopriors", "pid": "karpathy", "pod": {"en": "No Priors", "zh": "No Priors 播客"}, "date": "2024-09-05", "min": 44, "fields": ["robotics", "deep-learning"], "src": "https://youtu.be/hM_h0UA7upI", "tEn": "Andrej Karpathy on Self-Driving Cars, AGI, and the Gap Between Demo and Product", "tZh": "Andrej Karpathy 谈自动驾驶、AGI 以及演示与产品之间的差距", "addedAt": "2026-06-17"}, {"id": "henrymodisett-diveclub-2024", "pid": "henrymodisett", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2024-09-04", "min": 53, "fields": ["nlp", "product"], "src": "https://youtu.be/RO9KwjKIrXI", "tEn": "From Tech Demo to Billion-Dollar Product: Perplexity's Design Journey", "tZh": "从技术演示到十亿美元产品：Perplexity 的设计之旅", "addedAt": "2026-07-15T06:53:37Z"}, {"id": "kolter-20vc", "pid": "kolter", "pod": {"en": "20VC", "zh": "20VC 创投播客"}, "date": "2024-09-04", "min": 64, "fields": ["safety", "deep-learning"], "src": "https://youtu.be/F74iOm34y-8", "tEn": "AI Data Crisis: Myth or Reality?", "tZh": "AI 数据危机：神话还是现实？", "addedAt": "2026-06-17"}, {"id": "sutton-thetraje", "pid": "sutton", "pod": {"en": "The Trajectory", "zh": "The Trajectory"}, "date": "2024-08-09", "min": 86, "fields": ["rl", "deep-learning"], "src": "https://youtu.be/fRzL5Mt0c8A", "tEn": "The Keys Are Not Leaving Our Hand: Richard Sutton on Post-Human Intelligence", "tZh": "钥匙不在我们手中：理查德·萨顿谈后人类智能", "addedAt": "2026-06-17"}, {"id": "elon-lexfridm-2024", "pid": "elon", "pod": {"en": "Lex Fridman Podcast", "zh": "Lex Fridman 播客"}, "date": "2024-08-02", "min": 518, "fields": ["deep-learning", "robotics", "bio"], "src": "https://youtu.be/Kbk9BiPhm7o", "tEn": "Elon Musk on Neuralink's First Human Implant and the Future of Brain-Computer Interfaces", "tZh": "埃隆·马斯克谈 Neuralink 首例人体植入与脑机接口的未来", "addedAt": "2026-07-12T09:02:07Z"}, {"id": "nateparrott-diveclub-2024", "pid": "nateparrott", "pod": {"en": "Dive Club", "zh": "Dive Club"}, "date": "2024-08-01", "min": 52, "fields": ["product"], "src": "https://youtu.be/kUNm-iB1Cwc", "tEn": "From Snap Engineer to Founding Designer: Nate Parrott on Designing the Arc Browser", "tZh": "从 Snap 工程师到创始设计师：Nate Parrott 谈 Arc 浏览器的设计", "addedAt": "2026-08-16T09:49:14Z"}, {"id": "suleyman-intellig", "pid": "suleyman", "pod": {"en": "Intelligence Squared", "zh": "Intelligence Squared"}, "date": "2024-07-05", "min": 84, "fields": ["product"], "src": "https://youtu.be/S908LlqOLq0", "tEn": "From Philosophy to AI: Mustafa Suleyman's Journey", "tZh": "从哲学到人工智能：穆斯塔法·苏莱曼的旅程", "addedAt": "2026-06-17"}, {"id": "altman-thejoero", "pid": "altman", "pod": {"en": "The Joe Rogan Experience", "zh": "The Joe Rogan Experience"}, "date": "2024-06-27", "min": 157, "fields": ["nlp", "safety"], "src": "https://youtu.be/7dCPytNTnjk", "tEn": "AI Revolution: Navigating the Good and the Bad", "tZh": "AI 革命：驾驭好与坏", "addedAt": "2026-06-17"}, {"id": "dario-ingoodco-2024", "pid": "dario", "pod": {"en": "In Good Company", "zh": "In Good Company"}, "date": "2024-06-26", "min": 67, "fields": ["nlp", "safety"], "src": "https://youtu.be/xm6jNMSFT7g", "tEn": "AI Safety and Interpretability with Dario Amodei", "tZh": "AI 安全与可解释性：对话 Dario Amodei", "addedAt": "2026-06-17"}, {"id": "lambert-superdat", "pid": "lambert", "pod": {"en": "Super Data Science", "zh": "Super Data Science"}, "date": "2024-06-11", "min": 56, "fields": ["rl", "nlp"], "src": "https://youtu.be/McaI5kkQySU", "tEn": "AI's Societal Impact and Openness in Model Development", "tZh": "AI 的社会影响与模型开发的开放性", "addedAt": "2026-06-17"}, {"id": "hinton-sana", "pid": "hinton", "pod": {"en": "Sana", "zh": "Sana"}, "date": "2024-05-20", "min": 46, "fields": ["deep-learning"], "src": "https://youtu.be/n4IQOBka8bc", "tEn": "Selecting Talent and Early AI Inspirations", "tZh": "选拔人才与早期 AI 灵感", "addedAt": "2026-06-17"}, {"id": "leike-thecogni", "pid": "leike", "pod": {"en": "The Cognitive Revolution", "zh": "The Cognitive Revolution"}, "date": "2024-05-19", "min": 57, "fields": ["safety", "nlp"], "src": "https://youtu.be/lvjs-1SpX6U", "tEn": "OpenAI's Safety Crisis: Key Departures and Broken Promises", "tZh": "OpenAI 的安全危机：关键离职与承诺破裂", "addedAt": "2026-06-17"}, {"id": "mensch-20vc", "pid": "mensch", "pod": {"en": "20VC", "zh": "20VC 创投播客"}, "date": "2024-04-29", "min": 51, "fields": ["nlp"], "src": "https://youtu.be/e7Y84vpWhkU", "tEn": "Mistral AI Founder on Scaling, DeepMind Lessons, and the 7B Model", "tZh": "Mistral AI 创始人谈扩展、DeepMind 经验与 7B 模型", "addedAt": "2026-06-17"}, {"id": "feifei-youngand", "pid": "feifei", "pod": {"en": "Young and Profiting", "zh": "Young and Profiting"}, "date": "2024-04-25", "min": 53, "fields": ["deep-learning"], "src": "https://youtu.be/IePcaP5FY3Q", "tEn": "AI's Progress and Limitations: A Conversation with Dr. Fei-Fei Li", "tZh": "AI 的进展与局限：与李飞飞博士的对话", "addedAt": "2026-06-17"}, {"id": "zuckerberg-dwarkesh-2024", "pid": "zuckerberg", "pod": {"en": "Dwarkesh Podcast", "zh": "Dwarkesh 播客"}, "date": "2024-04-18", "min": 79, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/bc6uFV9CJGg", "tEn": "Meta's AI Ambitions: Llama 3, Open Source, and the Future of Intelligence", "tZh": "Meta 的 AI 雄心：Llama 3、开源与智能未来", "addedAt": "2026-07-19T14:40:57Z"}, {"id": "sholto-dwarkesh", "pid": "sholto", "pod": {"en": "Dwarkesh Podcast", "zh": "Dwarkesh 播客"}, "date": "2024-03-28", "min": 193, "fields": ["nlp", "rl"], "src": "https://youtu.be/UTuuTTnjxMQ", "tEn": "Long Context: The Underhyped Key to Superhuman AI", "tZh": "长上下文：通往超人类 AI 的被低估的关键", "addedAt": "2026-06-17"}, {"id": "altman-lexfridm-2024", "pid": "altman", "pod": {"en": "Lex Fridman Podcast", "zh": "Lex Fridman 播客"}, "date": "2024-03-18", "min": 115, "fields": ["nlp", "safety"], "src": "https://youtu.be/jvqFAi7vkBc", "tEn": "Sam Altman on the OpenAI Board Saga and Power Struggles on the Road to AGI", "tZh": "Sam Altman 谈 OpenAI 董事会风波与通往 AGI 之路上的权力斗争", "addedAt": "2026-07-12T08:50:40Z"}, {"id": "lecun-lexfridm", "pid": "lecun", "pod": {"en": "Lex Fridman Podcast", "zh": "Lex Fridman 播客"}, "date": "2024-03-07", "min": 167, "fields": ["deep-learning"], "src": "https://youtu.be/5t1vTLU7s40", "tEn": "Yann LeCun: Open Source AI vs Proprietary Systems, LLMs Limitations, and the Path to AGI", "tZh": "Yann LeCun：开源 AI 与专有系统、大语言模型的局限以及通往 AGI 之路", "addedAt": "2026-06-17"}, {"id": "demis-dwarkesh-2024", "pid": "demis", "pod": {"en": "Dwarkesh Podcast", "zh": "Dwarkesh 播客"}, "date": "2024-02-28", "min": 62, "fields": ["deep-learning", "rl"], "src": "https://youtu.be/qTogNUV3CAI", "tEn": "AGI within a Decade? Demis Hassabis on Intelligence, Transfer Learning, and Neuroscience Insights", "tZh": "十年内实现 AGI？Demis Hassabis 谈智能、迁移学习与神经科学洞见", "addedAt": "2026-06-17"}, {"id": "sutton-edanmeye", "pid": "sutton", "pod": {"en": "Edan Meyer", "zh": "Edan Meyer"}, "date": "2024-01-08", "min": 90, "fields": ["rl", "deep-learning"], "src": "https://youtu.be/4feeUJnrrYg", "tEn": "Rich Sutton on the Alberta Plan and the Three Waves of Neural Networks", "tZh": "Rich Sutton 谈阿尔伯塔计划与神经网络的三个浪潮", "addedAt": "2026-06-17"}, {"id": "mensch-nopriors", "pid": "mensch", "pod": {"en": "No Priors", "zh": "No Priors 播客"}, "date": "2023-11-09", "min": 33, "fields": ["nlp"], "src": "https://youtu.be/EMOFRDOMIiU", "tEn": "Mistral 7B: Changing the Game with Small Open Source AI Models", "tZh": "Mistral 7B：用小型开源 AI 模型改变游戏规则", "addedAt": "2026-06-17"}, {"id": "elon-lexfridm", "pid": "elon", "pod": {"en": "Lex Fridman Podcast", "zh": "Lex Fridman 播客"}, "date": "2023-11-09", "min": 137, "fields": ["product"], "src": "https://youtu.be/JN3KPFbWCy8", "tEn": "Elon Musk on War, Human Nature, and Peace in the Middle East", "tZh": "埃隆·马斯克谈战争、人性与中东和平", "addedAt": "2026-06-17"}, {"id": "awang-thelogan", "pid": "awang", "pod": {"en": "The Logan Bartlett Show", "zh": "The Logan Bartlett Show"}, "date": "2023-11-03", "min": 92, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/gDMemWgEJak", "tEn": "Alexander Wang on Data as the New Code and the Future of AI", "tZh": "Alexander Wang：数据是新代码，以及 AI 的未来", "addedAt": "2026-06-17"}, {"id": "percyliang-imbue-2023", "pid": "percyliang", "pod": {"en": "Imbue", "zh": "Imbue"}, "date": "2023-11-01", "min": 62, "fields": ["nlp", "safety"], "src": "https://youtu.be/RLgqhzJM43E", "tEn": "Percy Liang on Foundation Models, Shared Reality, and the Evolution of NLP", "tZh": "Percy Liang 谈基础模型、共享现实与 NLP 的演变", "addedAt": "2026-06-27"}, {"id": "olah-80000hou-2023", "pid": "olah", "pod": {"en": "80,000 Hours", "zh": "80,000 小时"}, "date": "2023-10-31", "min": 189, "fields": ["safety"], "src": "https://youtu.be/k_QVDwhR8FU", "tEn": "Chris Olah on Neural Network Interpretability and AI Safety", "tZh": "Chris Olah 谈神经网络可解释性与 AI 安全", "addedAt": "2026-06-27"}, {"id": "jimfan-outsetca-2023", "pid": "jimfan", "pod": {"en": "Outset Capital", "zh": "Outset Capital"}, "date": "2023-10-20", "min": 52, "fields": ["robotics", "rl"], "src": "https://youtu.be/gl-g9k0qm5Q", "tEn": "From AlexNet to OpenAI: A Decade of AI Milestones", "tZh": "从 AlexNet 到 OpenAI：人工智能十年的里程碑", "addedAt": "2026-06-23"}, {"id": "leike-80000hou", "pid": "leike", "pod": {"en": "80,000 Hours", "zh": "80,000 小时"}, "date": "2023-08-22", "min": 176, "fields": ["safety", "nlp"], "src": "https://youtu.be/ZP_N4q5U3eE", "tEn": "OpenAI’s push to make superintelligence safe", "tZh": "OpenAI 让超级智能变安全的努力", "addedAt": "2026-06-17"}, {"id": "suleyman-thisweek", "pid": "suleyman", "pod": {"en": "This Week in Startups", "zh": "This Week in Startups"}, "date": "2023-08-18", "min": 75, "fields": ["product", "deep-learning"], "src": "https://youtu.be/z3hmfSVmyqg", "tEn": "From Poker to DeepMind: Mustafa Suleyman on the Origins of AI", "tZh": "从扑克到 DeepMind：穆斯塔法·苏莱曼谈 AI 起源", "addedAt": "2026-06-17"}, {"id": "malik-therobot-2023", "pid": "malik", "pod": {"en": "The Robot Brains", "zh": "The Robot Brains"}, "date": "2023-08-16", "min": 92, "fields": ["robotics", "deep-learning"], "src": "https://youtu.be/k_Wrd1kI1B0", "tEn": "Berkeley Professor Jitendra Malik on AI's Limits vs Human Intelligence", "tZh": "伯克利教授 Jitendra Malik 谈 AI 与人类智能的差距", "addedAt": "2026-06-27"}, {"id": "dario-dwarkesh-2023", "pid": "dario", "pod": {"en": "Dwarkesh Podcast", "zh": "Dwarkesh 播客"}, "date": "2023-08-08", "min": 119, "fields": ["nlp", "safety"], "src": "https://youtu.be/Nlkk3glap_U", "tEn": "Why Scaling Works and What It Means for AGI", "tZh": "缩放定律为何有效及其对 AGI 的意义", "addedAt": "2026-06-17"}, {"id": "schulman-therobot-2023", "pid": "schulman", "pod": {"en": "The Robot Brains", "zh": "The Robot Brains"}, "date": "2023-08-03", "min": 57, "fields": ["rl", "nlp"], "src": "https://youtu.be/nM_3d37lmcM", "tEn": "Building ChatGPT: From Pretraining to RLHF", "tZh": "构建 ChatGPT：从预训练到 RLHF", "addedAt": "2026-06-17"}, {"id": "murati-microsof", "pid": "murati", "pod": {"en": "Microsoft", "zh": "Microsoft"}, "date": "2023-07-11", "min": 66, "fields": ["nlp"], "src": "https://youtu.be/5PGBn1t5CLQ", "tEn": "Mira Murati: From Math Olympiads to OpenAI CTO", "tZh": "米拉·穆拉蒂：从数学奥林匹克到 OpenAI 首席技术官", "addedAt": "2026-06-17"}, {"id": "zuckerberg-lexfridm-2023", "pid": "zuckerberg", "pod": {"en": "Lex Fridman Podcast", "zh": "Lex Fridman 播客"}, "date": "2023-06-08", "min": 162, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/Ff4fRgnuFgQ", "tEn": "Mark Zuckerberg on Jiu-Jitsu, Fear, and Learning", "tZh": "马克·扎克伯格谈柔术、恐惧与学习", "addedAt": "2026-07-19T14:51:15Z"}, {"id": "gustav-lennyspo-2023", "pid": "gustav", "pod": {"en": "Lenny’s Podcast", "zh": "Lenny 的播客"}, "date": "2023-05-21", "min": 84, "fields": ["product", "nlp"], "src": "https://youtu.be/QtJoYFyrdPI", "tEn": "From Curation to Generation: Spotify's Gustav Söderström on AI and Product Evolution", "tZh": "从策展到生成：Spotify 的 Gustav Söderström 谈 AI 与产品演变", "addedAt": "2026-08-09T04:20:34Z"}, {"id": "yejin-therobot-2023", "pid": "yejin", "pod": {"en": "The Robot Brains", "zh": "The Robot Brains"}, "date": "2023-05-17", "min": 61, "fields": ["nlp"], "src": "https://youtu.be/MKyTVPCVoWg", "tEn": "Yejin Choi on Large Language Models: Progress, Limitations, and the Quest for Intelligence", "tZh": "Yejin Choi 谈大型语言模型：进展、局限与智能探索", "addedAt": "2026-06-27"}, {"id": "nando-therobot-2023", "pid": "nando", "pod": {"en": "The Robot Brains", "zh": "The Robot Brains"}, "date": "2023-04-26", "min": 76, "fields": ["deep-learning", "rl"], "src": "https://youtu.be/dKvYRgOifFA", "tEn": "Nando de Freitas on AI as a Tool for All Humanity", "tZh": "Nando de Freitas：AI 作为全人类的工具", "addedAt": "2026-06-27"}, {"id": "noambrown-nopriors-2023", "pid": "noambrown", "pod": {"en": "No Priors", "zh": "No Priors 播客"}, "date": "2023-04-25", "min": 61, "fields": ["rl", "nlp"], "src": "https://youtu.be/AAv1S9E6ogE", "tEn": "From Poker to Diplomacy: Noam Brown on AI and Game Theory", "tZh": "从扑克到外交：Noam Brown 谈 AI 与博弈论", "addedAt": "2026-06-17"}, {"id": "bubeck-sparksof-2023", "pid": "bubeck", "pod": {"en": "Sparks of AGI", "zh": "Sparks of AGI（MIT 演讲）"}, "date": "2023-04-06", "min": 49, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/qbIk7-JPB2c", "tEn": "Sparks of AGI: Early Experiments with GPT-4", "tZh": "AGI 的火花：GPT-4 早期实验", "addedAt": "2026-06-27"}, {"id": "ilya-dwarkesh-2023", "pid": "ilya", "pod": {"en": "Dwarkesh Podcast", "zh": "Dwarkesh 播客"}, "date": "2023-03-27", "min": 48, "fields": ["deep-learning", "safety"], "src": "https://youtu.be/Yf1o0TQzry8", "tEn": "Challenges and Future of AI: Alignment, Reliability, and Economic Impact", "tZh": "AI 的挑战与未来：对齐、可靠性与经济影响", "addedAt": "2026-06-17"}, {"id": "altman-lexfridm-2023", "pid": "altman", "pod": {"en": "Lex Fridman Podcast", "zh": "Lex Fridman 播客"}, "date": "2023-03-25", "min": 144, "fields": ["nlp", "safety"], "src": "https://youtu.be/L_Guz73e6fw", "tEn": "Sam Altman on AGI, GPT-4, and the Future of AI", "tZh": "Sam Altman 谈 AGI、GPT-4 与 AI 的未来", "addedAt": "2026-07-12T08:52:29Z"}, {"id": "shazeer-aarthian-2023", "pid": "shazeer", "pod": {"en": "Aarthi and Sriram Show", "zh": "Aarthi & Sriram"}, "date": "2023-01-21", "min": 63, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/XxFj5jdb6qQ", "tEn": "Noam Shazeer: From Google's Early Days to AI's Future", "tZh": "诺姆·沙泽尔：从谷歌早期到 AI 的未来", "addedAt": "2026-06-17"}, {"id": "hugobarra-20vc-2022", "pid": "hugobarra", "pod": {"en": "20VC", "zh": "20VC 创投播客"}, "date": "2022-11-09", "min": 58, "fields": ["product"], "src": "https://youtu.be/AAOSDY_m93g", "tEn": "From Brazil to Siri: A Product Leader's Journey", "tZh": "从巴西到 Siri：一位产品领袖的旅程", "addedAt": "2026-08-14T09:18:54Z"}, {"id": "karpathy-lexfridm", "pid": "karpathy", "pod": {"en": "Lex Fridman Podcast", "zh": "Lex Fridman 播客"}, "date": "2022-10-29", "min": 209, "fields": ["deep-learning"], "src": "https://youtu.be/cdiD-9MMpb0", "tEn": "Physics Exploits and the Puzzle of the Universe", "tZh": "物理漏洞与宇宙谜题", "addedAt": "2026-06-17"}, {"id": "carlpei-credcuri-2022", "pid": "carlpei", "pod": {"en": "CRED curious", "zh": "CRED curious"}, "date": "2022-08-29", "min": 52, "fields": ["product"], "src": "https://youtu.be/WsHt6-_Pk40", "tEn": "From Nothing to Something: A Founder's Journey", "tZh": "从无到有：创始人的旅程", "addedAt": "2026-08-14T09:36:52Z"}, {"id": "fadell-20vcwith-2022", "pid": "fadell", "pod": {"en": "20VC", "zh": "20VC 创投播客"}, "date": "2022-07-25", "min": 56, "fields": ["deep-learning", "product"], "src": "https://youtu.be/rb4xf913zfA", "tEn": "36 Questions of Love: Childhood Moves and Parenting", "tZh": "爱的 36 问：童年搬家与育儿之道", "addedAt": "2026-07-19T09:55:39Z"}, {"id": "fadell-lexfridm-2022", "pid": "fadell", "pod": {"en": "Lex Fridman Podcast", "zh": "Lex Fridman 播客"}, "date": "2022-06-15", "min": 166, "fields": ["deep-learning", "product"], "src": "https://youtu.be/4oDZyOf6CW4", "tEn": "Tony Fadell: The Magic of Early Programming and Creating Tools", "tZh": "托尼·法德尔：早期编程与创造工具的神奇之处", "addedAt": "2026-07-19T09:45:30Z"}, {"id": "fadell-thetimfe-2022", "pid": "fadell", "pod": {"en": "The Tim Ferriss Show", "zh": "蒂姆·费里斯秀"}, "date": "2022-04-28", "min": 104, "fields": ["deep-learning", "product"], "src": "https://youtu.be/-NuLOKEII2U", "tEn": "From Reluctance to Book: Tony's Journey to Write 'Build'", "tZh": "从抗拒到成书：托尼撰写《Build》的心路历程", "addedAt": "2026-07-19T09:48:03Z"}, {"id": "albertgu-stanford-2022", "pid": "albertgu", "pod": {"en": "Stanford MedAI", "zh": "斯坦福 MedAI 讲座"}, "date": "2022-03-01", "min": 67, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/luCBXCErkCs", "tEn": "Efficiently Modeling Long Sequences with Structured State Spaces", "tZh": "使用结构化状态空间高效建模长序列", "addedAt": "2026-06-27"}, {"id": "bengio-machinel", "pid": "bengio", "pod": {"en": "Machine Learning Street Talk", "zh": "ML Street Talk"}, "date": "2022-02-22", "min": 93, "fields": ["deep-learning"], "src": "https://youtu.be/M49TMqK5uCE", "tEn": "Active Learning and GFlowNets with Professor Yoshua Bengio", "tZh": "与约书亚·本吉奥教授探讨主动学习与 GFlowNets", "addedAt": "2026-06-17"}, {"id": "lecun-lexfridm-2022", "pid": "lecun", "pod": {"en": "Lex Fridman Podcast", "zh": "Lex Fridman 播客"}, "date": "2022-01-22", "min": 165, "fields": ["deep-learning"], "src": "https://youtu.be/SGzMElJ11Cc", "tEn": "Self-Supervised Learning: The Dark Matter of Intelligence", "tZh": "自监督学习：智能的暗物质", "addedAt": "2026-06-17"}, {"id": "elon-lexfridm-2021", "pid": "elon", "pod": {"en": "Lex Fridman Podcast", "zh": "Lex Fridman 播客"}, "date": "2021-12-28", "min": 152, "fields": ["product"], "src": "https://youtu.be/DxREm3s1scA", "tEn": "Elon Musk on SpaceX's Historic Launch and the Future of Space Exploration", "tZh": "埃隆·马斯克谈 SpaceX 历史性发射与太空探索的未来", "addedAt": "2026-07-12T08:56:06Z"}, {"id": "jonyive-wired-2021", "pid": "jonyive", "pod": {"en": "WIRED", "zh": "WIRED"}, "date": "2021-11-10", "min": 40, "fields": ["product"], "src": "https://youtu.be/piCuW2wSSTA", "tEn": "Jony Ive on the 20th Anniversary of the iPod and the Shift to Wearables", "tZh": "Jony Ive 谈 iPod 二十周年与可穿戴设备的转型", "addedAt": "2026-08-14T09:45:05Z"}, {"id": "abbeel-thetwiml-2021", "pid": "abbeel", "pod": {"en": "The TWIML AI Podcast", "zh": "TWIML AI 播客"}, "date": "2021-04-19", "min": 66, "fields": ["robotics", "rl"], "src": "https://youtu.be/ILOYNXUYUxA", "tEn": "AI and Robotics: From Lab to Real World with Pieter Abbeel", "tZh": "人工智能与机器人：从实验室到现实世界——对话 Pieter Abbeel", "addedAt": "2026-08-17T03:37:03Z"}, {"id": "pathak-cmurobot-2020", "pid": "pathak", "pod": {"en": "CMU Robotics Institute", "zh": "CMU 机器人研究所"}, "date": "2020-11-23", "min": 67, "fields": ["robotics", "rl"], "src": "https://youtu.be/Oabu6Gz1op0", "tEn": "Bridging the Generalization Gap in Machine Learning and Robotics", "tZh": "弥合机器学习与机器人领域的泛化差距", "addedAt": "2026-06-27"}, {"id": "naval-thetimfe-2020", "pid": "naval", "pod": {"en": "The Tim Ferriss Show", "zh": "蒂姆·费里斯秀"}, "date": "2020-10-16", "min": 122, "fields": ["deep-learning"], "src": "https://youtu.be/HiYo14wylQw", "tEn": "Naval Ravikant on Wealth, Happiness, and the Future of Work", "tZh": "Naval Ravikant 谈财富、幸福与工作的未来", "addedAt": "2026-07-03"}, {"id": "ilya-lexfridm-2020", "pid": "ilya", "pod": {"en": "Lex Fridman Podcast", "zh": "Lex Fridman 播客"}, "date": "2020-05-08", "min": 97, "fields": ["deep-learning", "safety"], "src": "https://youtu.be/13CZPWmke6A", "tEn": "Ilya Sutskever on the Deep Learning Revolution and the AlexNet Paper", "tZh": "Ilya Sutskever 谈深度学习革命与 AlexNet 论文", "addedAt": "2026-06-17"}, {"id": "andrewng-lexfridm-2020", "pid": "andrewng", "pod": {"en": "Lex Fridman Podcast", "zh": "Lex Fridman 播客"}, "date": "2020-02-20", "min": 89, "fields": ["deep-learning", "nlp"], "src": "https://youtu.be/0jspaMLxBig", "tEn": "Andrew Ng: From Coding at Age 5 to Educating Millions", "tZh": "吴恩达：从五岁编程到教育数百万人", "addedAt": "2026-06-17"}, {"id": "fadell-thetimfe-2019", "pid": "fadell", "pod": {"en": "The Tim Ferriss Show", "zh": "蒂姆·费里斯秀"}, "date": "2019-12-23", "min": 110, "fields": ["deep-learning", "product"], "src": "https://youtu.be/5M5SJ5u0Ke4", "tEn": "Tony Fadell on Quitting Caffeine and Alcohol", "tZh": "托尼·法德尔谈戒除咖啡因和酒精", "addedAt": "2026-07-19T09:50:43Z"}, {"id": "awang-thisweek-2019", "pid": "awang", "pod": {"en": "This Week in Startups", "zh": "This Week in Startups"}, "date": "2019-11-29", "min": 95, "fields": ["nlp", "deep-learning"], "src": "https://youtu.be/inP_07aO2MU", "tEn": "Scale AI CEO Alexander Wang on Raising $100M at 22", "tZh": "Scale AI CEO 王亚历山大：22 岁融资 1 亿美元", "addedAt": "2026-06-17"}, {"id": "ivyross-mindthep-2019", "pid": "ivyross", "pod": {"en": "Mind the Product", "zh": "Mind the Product"}, "date": "2019-10-07", "min": 25, "fields": ["product"], "src": "https://youtu.be/QzzZ0s4DbvU", "tEn": "Designing Google Hardware: A Case Study", "tZh": "谷歌硬件设计案例研究", "addedAt": "2026-08-14T09:40:25Z"}, {"id": "lecun-lexfridm-2019", "pid": "lecun", "pod": {"en": "Lex Fridman Podcast", "zh": "Lex Fridman 播客"}, "date": "2019-08-31", "min": 76, "fields": ["safety", "deep-learning"], "src": "https://youtu.be/SGSOCuByo24", "tEn": "Yann LeCun on AI Alignment and the Lessons from 2001: A Space Odyssey", "tZh": "杨立昆谈 AI 对齐与《2001 太空漫游》的启示", "addedAt": "2026-06-17"}, {"id": "naval-theknowl-2019", "pid": "naval", "pod": {"en": "The Knowledge Project Podcast", "zh": "知识项目播客"}, "date": "2019-08-17", "min": 122, "fields": ["deep-learning"], "src": "https://youtu.be/mGY2To_HW98", "tEn": "Naval Ravikant on Reading, Decision-Making, and Life", "tZh": "Naval Ravikant 谈阅读、决策与生活", "addedAt": "2026-07-03"}, {"id": "naval-thejoero-2019", "pid": "naval", "pod": {"en": "The Joe Rogan Experience", "zh": "The Joe Rogan Experience"}, "date": "2019-06-05", "min": 132, "fields": ["deep-learning"], "src": "https://youtu.be/3qHkcs3kG44", "tEn": "Balanced Life and Continuous Learning: A Conversation with a Tech Investor", "tZh": "平衡生活与持续学习：与一位科技投资者的对话", "addedAt": "2026-07-03"}, {"id": "brockman-lexfridm-2019", "pid": "brockman", "pod": {"en": "Lex Fridman Podcast", "zh": "Lex Fridman 播客"}, "date": "2019-04-03", "min": 85, "fields": ["deep-learning", "product"], "src": "https://youtu.be/bIrEM2FbOLU", "tEn": "From Chemistry to AI: Greg Brockman on Building Intelligent Systems", "tZh": "从化学到 AI：Greg Brockman 谈构建智能系统", "addedAt": "2026-06-17"}, {"id": "abbeel-lexfridm-2018", "pid": "abbeel", "pod": {"en": "Lex Fridman Podcast", "zh": "Lex Fridman 播客"}, "date": "2018-12-16", "min": 43, "fields": ["robotics", "rl"], "src": "https://youtu.be/l-mYLq6eZPY", "tEn": "Robot Tennis and Human-Robot Interaction", "tZh": "机器人网球与人机交互", "addedAt": "2026-06-17"}, {"id": "altman-ycombina-2018", "pid": "altman", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2018-11-08", "min": 36, "fields": ["product"], "src": "https://youtu.be/uEl2KUZ3JWA", "tEn": "Minimize Cognitive Load and Choose What Matters", "tZh": "减少认知负荷，选择重要之事", "addedAt": "2026-06-17"}, {"id": "bengio-lexfridm-2018", "pid": "bengio", "pod": {"en": "Lex Fridman Podcast", "zh": "Lex Fridman 播客"}, "date": "2018-10-20", "min": 42, "fields": ["deep-learning"], "src": "https://youtu.be/azOmzumh0vQ", "tEn": "Mysteries of Biological vs Artificial Neural Networks", "tZh": "生物神经网络与人工神经网络的神秘差异", "addedAt": "2026-06-17"}, {"id": "leike-80000hou-2018", "pid": "leike", "pod": {"en": "80,000 Hours", "zh": "80,000 小时"}, "date": "2018-09-16", "min": 46, "fields": ["safety", "nlp"], "src": "https://youtu.be/pmnTEsmGZuU", "tEn": "How to Have a Career in AI Safety Research", "tZh": "如何从事人工智能安全研究", "addedAt": "2026-06-17"}, {"id": "brockman-ycombina-2017", "pid": "brockman", "pod": {"en": "Y Combinator", "zh": "Y Combinator"}, "date": "2017-11-08", "min": 60, "fields": ["nlp", "safety"], "src": "https://youtu.be/UdIPveR__jw", "tEn": "AI Future: Hardware, Scaling, and Getting Started", "tZh": "AI 未来：硬件、规模扩展与入门指南", "addedAt": "2026-06-17"}, {"id": "bengio-deeplear-2016", "pid": "bengio", "pod": {"en": "Deep Learning Lecture", "zh": "深度学习公开课"}, "date": "2016-09-27", "min": 72, "fields": ["deep-learning"], "src": "https://youtu.be/11rsu_WwZTc", "tEn": "Defeating the Curse of Dimensionality with Deep Learning", "tZh": "用深度学习战胜维度灾难", "addedAt": "2026-06-17"}, {"id": "demis-publicle-2015", "pid": "demis", "pod": {"en": "Public Lecture", "zh": "公开讲座"}, "date": "2015-11-19", "min": 74, "fields": ["deep-learning", "rl"], "src": "https://youtu.be/0X-NdPtFKq0", "tEn": "AI and the Future: From Chess to DeepMind", "tZh": "人工智能与未来：从国际象棋到 DeepMind", "addedAt": "2026-06-17"}, {"id": "fadell-hayfesti-2014", "pid": "fadell", "pod": {"en": "Hay Festival", "zh": "海伊文化节"}, "date": "2014-08-08", "min": 64, "fields": ["deep-learning", "product"], "src": "https://youtu.be/shks0r2tD7c", "tEn": "Tony Fadell: From Childhood Tinkering to Creating the iPod", "tZh": "托尼·法德尔：从童年动手到创造 iPod", "addedAt": "2026-07-19T09:57:59Z"}, {"id": "kolter-mllectur-2014", "pid": "kolter", "pod": {"en": "ML Lecture", "zh": "机器学习公开课"}, "date": "2014-07-09", "min": 62, "fields": ["deep-learning"], "src": "https://youtu.be/s-PIbqfcRx0", "tEn": "Machine Learning Algorithms, Unsupervised Learning, and Probability", "tZh": "机器学习算法、无监督学习与概率", "addedAt": "2026-06-17"}, {"id": "andrewng-openedke-2013", "pid": "andrewng", "pod": {"en": "OpenEd Keynote", "zh": "OpenEd 主题演讲"}, "date": "2013-11-06", "min": 40, "fields": ["deep-learning", "nlp"], "src": "https://youtu.be/jbo2eiU2V2A", "tEn": "Scaling Education with Online Courses", "tZh": "用在线课程扩大教育规模", "addedAt": "2026-06-17"}];

/* ====== REAL ASSETS: 人物照片（Wikimedia Commons） + 媒体封面（Apple Podcasts） ====== */
const PHOTOS=new Set(['ethanmollick','dhh','animaanandkumar','paragagrawal','johnbai','mattmcpartland','melisatokmak','fatihporikli','patrickmorgan','arimorcos','susankare','brettadcock','berntbornich','brendanfoody','alexkrentsel','abbeel','adambrown','adamgleave','adamward','ajambrosino','akshatbubna','akshaynathan','albertgu','alejandromatamala','alexatallah','alexrives','alexwei','alibehrouz','altman','ammaarreshi','amolavasare','andreessen','andrewng','andybeam','andyfang','andymadrick','angelajiang','antonoglou','aravind','arvindjain','askell','awang','batson','benedictevans','bengio','benmann','bethbarnes','billpeebles','boris','bowang','brandonjacoby','brettaylor','brettwilliams','brianlovin','bricken','brockman','bubeck','caitlin','cameronworboys','carinahong','carlpei','carlrivera','catanzaro','catwu','charliedeets','chowdhery','chrispedregal','christiano','clairevo','collison','danbalsam','danbiderman','danklein','danshipper','dario','davidad','davidsp','deanball','delangue','demis','derya','deviparikh','diannepenn','dmitridolgov','dsilver','dylanfield','dylanpatel','edunov','edwinchen','eisokant','elizabethstone','elon','emilycampbell','ericjang','erikschluntz','ermon','eschavera','ethanhe','evanspiegel','fadell','fedus','feifei','feldman','felixrieseberg','finn','fiona','flocrivello','floraguo','fulford','gabepereyra','garrytan','geoffreylitt','godement','gomez','grantsanderson','gunnargray','gustav','hafner','hannahhearth','harrisonchase','hasani','hausman','hendrycks','henrymodisett','hinton','hugobarra','iansilber','igorbabuschkin','ilya','ivyross','jackph','jaderberg','jasonwei','jasonyuan','jeffdean','jennywen','jensen','jhoward','jimfan','joellewenstein','jonyive','joonpark','joshmeier','joshpuckett','julienmartin','jumper','jureleskovec','justinjohnson','kaiser','kaplan','kareemamin','karina','karlkoch','karpathy','katarinabatina','katelynlesse','katiedill','kellerrinaudocliffto','kendall','kohli','kokotajlo','kolter','krispuckett','kylezantos','lambert','lamismukta','lample','laskin','lecun','leike','linqiao','lipbutan','llion','logankilpatrick','loredanacrisan','luisouriach','malik','markchen','marvinschwaibold','matangrinberg','matei','matthieuwyart','mattsellers','mattwhite','maxhodak','meaghanchoi','mengto','mensch','mikekrieger','mjordan','mosseri','murati','nadchishtie','nanda','nando','nateparrott','naval','neelnanda','noambrown','noamsegal','olah','oriol','pablostanley','pachocki','parada','pathak','percyliang','perszyk','philipjohnston','philipkiely','pietroschirano','pincus','pollydarcy','pullen','qasaryounis','rafaconde','raschka','rasmusandersson','reinerpope','robertlange','rodriques','rohinshah','romantesliuk','rongoldin','roozmahdavian','rudin','ryangreenblatt','ryanstephen','ryolu','sachinkatti','samstephenson','saravienna','satya','schmidhuber','schulman','scottwu','shanahan','shanelegg','shawnwang','shazeer','sherwinwu','sholto','simonwillison','slevine','springenberg','steinberger','stephenhaney','steveruiz','suleyman','sundarpichai','sutton','tejal','thariq','thomasahle','thomaswolf','timcook','tombrown','tommcgrath','tommygeoco','tomverrilli','traviskalanick','tridao','truell','tuhinkumar','turley','tworek','varun','vitalyfriedman','waldenyan','wiltschko','yejin','zuckerberg','zvi','michaelkratsios','damianborth']);
const POD_LOGO={
   'Latent Space':'latentspace',
   'Lex Fridman Podcast':'lexfridmanpodc',
   'Training Data':'trainingdata',
   'Dive Club':'diveclub',
   'Dwarkesh Patel':'dwarkeshpatel',
   'A la french  💻':'alafrench',
   'David Senra':'davidsenra',
   'SemiAnalysis':'semianalysis',
   'ClickHouse':'clickhouse',
   'Over The Horizon':'overthehorizon',
   'Washington Post Live':'washingtonpost',
   'The MAD Podcast with Matt Turck':'themadpodcastw',
   'Motley Fool Conversations':'motleyfoolconv',
   'FoundMyFitness':'foundmyfitness',
   'TechSurge: Deep Tech VC Podcast':'techsurgedeept',
   'Berggruen Institute':'berggrueninsti',
   'Lawfare':'lawfare',
   'Avec':'avec',
   'MTS ':'mts',
   'Founders':'founders',
   'Great Company with Jamie Laing':'greatcompanywi',
   'Vision Economy':'visioneconomy',
   'Peter Yang':'peteryang',
   'How I AI':'howiai',
   'Giant Ideas':'giantideas',
   'Sourcery with Molly O\'Shea':'sourcerywithmo',
   'Tiger Sisters':'tigersisters',
   'No Priors: AI, Machine Learning, Tech, & Startups':'nopriorsaimach',
   'Sourcery with Molly O\'Shea':'sourcerywithmo',
   'The Futurology Podcast':'futurology',
   'Colin and Samir':'colinandsamir',
   'Acquired':'acquired',
   'Newcomer':'newcomer',
   'Hay Festival':'hayfestival',
   'Stanford (SIEPR)':'stanfordsiepr',
   'Cadence':'cadence',
   'Bloomberg Podcasts':'bloombergpodca',
   'The AI Why with Liam Lawson':'theaiwhywithli',
   'AI & Design Podcast':'aidesignpodcas',
   'Parzival of Algorithmic Progress':'parzivalofalgo',
   'Reid Hoffman':'reidhoffman',
   'Dive Club':'diveclub',
   'The a16z Podcast':'thea16zpodcast',
   'Analyse Podcast':'analysepodcast',
   'Complex':'complex',
   'New York Post':'newyorkpost',
   'Gradient Dissent':'gradientdissent',
   'Stanford Department of Medicine':'stanforddepart',
   'AI News & Podcast':'ainewspodcast',
   'Simon Sinek':'simonsinek',
   'Sequoia Capital':'sequoiacapital',
   'James Altucher':'jamesaltucher',
   'iAfrikan Media ':'iafrikanmedia',
   'The Tim Ferriss Show':'thetimferrisss','Modern Wisdom':'modernwisdom','Naval':'naval','AI & I':'aii',
   'Agents of Tech':'agentsoftech','The Peterman Pod':'thepetermanpod',
   'The TWIML AI Podcast':'thetwimlaipodc',
   'Before AGI':'beforeagi','Outset Capital':'outsetcapital','Relentless':'relentless',
   'The Knowledge Project Podcast':'theknowledgepr',
   'Associated Press':'associatedpres',
   'Bloomberg Originals':'bloombergorigi',
   'Casey Newton':'caseynewton',
   'Stanford Graduate School of Business':'stanfordgradua',
   'Alex Kantrowitz':'alexkantrowitz',
   'Aarthi and Sriram Show':'aarthiandsrira','NVIDIA':'nvidia','Silicon Valley Girl':'siliconvalleyg','The Robot Brains':'therobotbrains',
   'All-In Podcast':'allinpodcast','CNBC':'cnbc','Center for Humane Technology':'centerforhuman','Google DeepMind':'googledeepmind','Shawn Ryan Show':'shawnryanshow','Sinead Bovell':'sineadbovell','Stanford Digital Economy Lab':'stanford','TBPN':'tbpn','TED':'ted','The Economic Times':'theeconomictim','The Information Bottleneck':'theinformation','The Pragmatic Engineer':'thepragmaticen','The Royal Institution':'theroyalinstit','Tucker Carlson':'tuckercarlson','Turing Post':'turingpost',
  'Dwarkesh Podcast':'dwarkeshpodcas','Lex Fridman Podcast':'lexfridmanpodc','No Priors':'nopriors','Machine Learning Street Talk':'machinelearnin',
  '80,000 Hours':'80000hours','Hard Fork':'hardfork',
  'Interesting Times':'interestingtim','Training Data':'trainingdata','Lenny’s Podcast':'lennyspodcast',
  'Latent Space':'latentspace','The Diary Of A CEO':'thediaryofaceo','StarTalk':'startalk',
  'The Weekly Show':'theweeklyshow','Unsupervised Learning':'unsupervisedle','Decoder':'decoder',
  'Cheeky Pint':'cheekypint','Big Technology':'bigtechnology','20VC':'20vc','The Joe Rogan Experience':'joerogan','The MAD Podcast':'themadpodcas','Interconnects':'interconnect','Core Memory':'corememory','Y Combinator':'ycombinator','Lex Fridman Podcast':'lexfridmanpodc','Machine Learning Street Talk':'machinelearnin','The Cognitive Revolution':'thecognitivere','Intelligence Squared':'intelligencesq','This Week in Startups':'thisweekinstar','Young and Profiting':'youngandprofit','The Trajectory':'thetrajectory','Super Data Science':'superdatascien','The Logan Bartlett Show':'theloganbartle',
  'Claude':'claude',
  'PowerfulJRE':'powerfuljre',
  'Semafor Tech':'semafortech',
  '@Scale':'scale',
  'LangChain Interrupt':'langchaininter',
  'The OpenAI Podcast':'theopenaipodca',
  
  'The Circuit (Bloomberg)':'thecircuitbloo',
  'Computer Vision and Geometry Group, ETH Zurich':'computervision',
  'Bloomberg Live':'bloomberglive',
  'Bloomberg':'bloomberg',
  'Acquired Unplugged (presented by WorkOS)':'acquiredunplug',
  'ARC Prize':'arcprize',
  
  'AI Proem':'aiproem',
  'Stripe Sessions (with Patrick Collison)':'stripesessions',
  'Jon Hernandez AI (Inteligencia Artificial con Jon Hernandez)':'jonhernandezai',
  'NothingButTech':'nothingbuttech',
  
  
  
  'Lisa Burke':'lisaburke',
  'Upstarts Media':'upstartsmedia',
  'Huge If True':'hugeiftrue',
  'AI Agent Frontier':'aiagentfrontie',
  'Radio Davos (World Economic Forum)':'radiodavosworl',
  'The AmberMac Show':'theambermacsho',
  'The Generalist':'thegeneralist',
  'This Is The World':'thisistheworld',
  'Institute for Pure & Applied Mathematics (IPAM)':'instituteforpu',
  'Databricks Fireside':'databricksfire',
  'People by WTF':'peoplebywtf',
  
  'Offcall':'offcall',
  'Financial Times':'financialtimes',
  'Axios':'axios',
  'WSJ at Davos':'wsjatdavos',
  'BuzzRobot':'buzzrobot',
  'Moonshots with Peter Diamandis':'moonshotswithp',
  'Laude Institute':'laudeinstitute',
  'Anthropic':'anthropic',
  'Masters of Scale':'mastersofscale',
  
  'Public Lecture':'publiclecture',
  'Stanford AI Club':'stanfordaiclub',
  'Matthew Berman':'matthewberman',
  'SingularityNET (AGI-25 Conference)':'singularitynet',
  
  'Nexus Luxembourg':'nexusluxembour',
  'Stanford Online':'stanfordonline',
  'AI Inside':'aiinside',
  'Cleo Abram':'cleoabram',
  'South Park Commons':'southparkcommo',
  'In Good Company':'ingoodcompany',
  'Sana':'sana',
  'Edan Meyer':'edanmeyer',
  'Imbue':'imbue',
  'Microsoft':'microsoft',
  'Sparks of AGI':'sparksofagi',
  'Stanford MedAI':'stanfordmedai',
  'CMU Robotics Institute':'cmuroboticsins',
  'Deep Learning Lecture':'deeplearningle',
  'ML Lecture':'mllecture',
  'OpenEd Keynote':'openedkeynote',
  'MIT IMES':'mitimes',
  'Nobel Prize':'nobelprize',
  'Bain Capital Ventures':'baincapitalven',
  'CNN':'cnn',
  'Tetragrammaton':'tetragrammaton',
  'ANI News':'aninews',
  'Princeton University':'princetonunive',
  'ACM ByteCast':'acmbytecast',
  'Finoverse':'finoverse',
  'CNA':'cna',
  'This Week in AI':'thisweekinai',
  'Ryan Peterman':'ryanpeterman',
  'Eric Jorgenson':'ericjorgenson',
  'Oprah':'oprah',
  'Bg2 Pod':'bg2pod',
  'This Past Weekend':'thispastweeken',
};
const podLogo=(e,cls='')=>POD_LOGO[e.pod.en]
  ? `<img class="podlogo ${cls}" src="assets/pods/${POD_LOGO[e.pod.en]}.webp" alt="${e.pod.en}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='assets/pods/${POD_LOGO[e.pod.en]}.jpg'">` : '';

/* 播客媒体简介（详情页用） */
const POD_INFO = {
 "David Senra": {
  "zh": "David Senra",
  "host": "David Senra",
  "en": "Podcast about Travis Kalanick, Uber co-founder, covering his early struggles with Red Swoosh and intense startup journey.",
  "cn": "播客讲述Uber联合创始人Travis Kalanick的创业经历，包括早期Red Swoosh的艰难岁月。"
 },
 "Composio": {
  "zh": "Composio",
  "host": "Karan、Raul",
  "en": "Composio podcast: Arvind Jain of Glean discusses enterprise AI costs, open source models, and agent performance.",
  "cn": "Composio播客，主持人Karan和Raul对话Glean创始人Arvind Jain，探讨企业AI成本、开源模型及智能体表现。"
 },
 "SemiAnalysis": {
  "zh": "SemiAnalysis",
  "host": "Dylan, Jordan",
  "en": "Podcast on AI spending, escaped models, AI rollups, accelerators vs NVIDIA, and more.",
  "cn": "探讨AI支出、失控模型、AI整合、加速器与NVIDIA竞争等话题的播客。"
 },
 "ClickHouse": {
  "zh": "ClickHouse",
  "host": "Aaron Katz, Bret Taylor",
  "en": "CEO Aaron Katz and Bret Taylor discuss AI's current state at Open House 2026.",
  "cn": "ClickHouse CEO Aaron Katz与Sierra联合创始人Bret Taylor在Open House 2026上畅谈AI现状。"
 },
 "Over The Horizon": {
  "zh": "地平线之外",
  "host": "Over The Horizon",
  "en": "Podcast featuring exclusive interviews with tech leaders, exploring robotics and AI breakthroughs.",
  "cn": "科技播客，专访行业领袖，探讨机器人及AI前沿突破。"
 },
 "Washington Post Live": {
  "zh": "华盛顿邮报直播",
  "host": "华盛顿邮报",
  "en": "Washington Post Live hosts Andrew Ng on AI infrastructure, open-source models, and economic choices shaping US competitiveness.",
  "cn": "华盛顿邮报直播邀请吴恩达探讨AI基础设施、开源模型及影响美国竞争力的经济选择。"
 },
 "Motley Fool Conversations": {
  "zh": "Motley Fool 对话",
  "host": "Motley Fool",
  "en": "Zynga founder Mark Pincus discusses building internet companies, early Facebook investment, and his 'proven, better, new' framework for success.",
  "cn": "Zynga创始人马克·平卡斯谈互联网创业、早期投资Facebook，以及他的“已验证、更好、更新”框架。"
 },
 "Radical Ventures": {
  "zh": "Radical Ventures",
  "host": "Radical Ventures",
  "en": "Radical Talks brings AI researchers and founders together with Radical Ventures partners for masterclass-style deep dives into frontier research.",
  "cn": "Radical Ventures 的对谈栏目 Radical Talks，由基金合伙人与 AI 研究者、创业者深谈前沿研究，偏「大师课」式的技术拆解。"
 },
 "Out Of Office Podcast": {
  "zh": "Out Of Office 播客",
  "host": "Out Of Office",
  "en": "Candid long-form conversations with founders and investors about work, decisions and life outside the office.",
  "cn": "与创始人、投资人的坦率长谈，聊工作、决策，以及办公室之外的生活。"
 },
 "ACCESS Podcast": {
  "zh": "ACCESS 播客",
  "host": "Alex & Ellis",
  "en": "A weekly tech show hosted by Alex and Ellis covering AI apps, consumer hardware and the companies building them, with founder interviews.",
  "cn": "Alex 与 Ellis 主持的每周科技对谈，聊 AI 应用、消费硬件与背后的公司，并邀创始人访谈。"
 },
 "The Gstaad Guy Podcast": {
  "zh": "Gstaad Guy 播客",
  "host": "The Gstaad Guy",
  "en": "Long-form conversations with founders and creators about building distinctive brands, hosted by The Gstaad Guy.",
  "cn": "The Gstaad Guy 主持，与创始人、创作者长谈如何打造有辨识度的品牌。"
 },
 "Hatch Conference": {
  "zh": "Hatch 大会",
  "host": "Hatch Conference",
  "en": "A design and product conference in Europe; talks from practitioners on craft, process and how AI is reshaping design work.",
  "cn": "欧洲设计与产品大会，讲者多为一线从业者，聚焦手艺、流程，以及 AI 如何重塑设计工作。"
 },
 "FoundMyFitness": {
  "zh": "FoundMyFitness",
  "host": "Rhonda Patrick",
  "en": "Podcast exploring health, longevity, and science with expert interviews and research insights.",
  "cn": "探讨健康、长寿与科学的播客，提供专家访谈和研究见解。"
 },
 "TechSurge: Deep Tech VC Podcast": {
  "zh": "TechSurge：深科技风投播客",
  "host": "未知",
  "en": "A podcast exploring deep tech venture capital, covering startups, innovation, and investment trends.",
  "cn": "深科技风投播客，探讨初创企业、创新与投资趋势。"
 },
 "Huberman Lab": {
  "zh": "休伯曼实验室",
  "host": "Andrew Huberman",
  "en": "Stanford neuroscientist Andrew Huberman translates science into actionable protocols, hosting long-form conversations with researchers across neuroscience, health and AI.",
  "cn": "斯坦福神经科学家 Andrew Huberman 主持，把科研成果转化为可执行方案，与神经科学、健康与 AI 领域研究者做长篇对谈。"
 },
 "Berggruen Institute": {
  "zh": "伯格鲁恩研究所",
  "host": "伯格鲁恩研究所",
  "en": "A think tank fostering ideas for the future, hosting dialogues on creativity and AI with visionaries like David Goyer and Andrew Ng.",
  "cn": "独立智库，探讨未来理念，举办创意与AI领域先锋对话。"
 },
 "Jonny Miller│Nervous System Mastery": {
  "zh": "Jonny Miller│神经系统掌控",
  "host": "Jonny Miller",
  "en": "Jonny Miller hosts conversations on nervous system mastery, featuring Dan Shipper on AI's impact on creativity and work.",
  "cn": "Jonny Miller主持的播客，探讨神经系统掌控，本期与Dan Shipper讨论AI对创造力和工作的影响。"
 },
 "SXSW": {
  "zh": "SXSW",
  "host": "",
  "en": "South by Southwest — the Austin festival of tech, film and music; its conference stage hosts founders and creators in long-form conversation.",
  "cn": "西南偏南（SXSW）：奥斯汀的科技、电影与音乐盛会，主舞台常有创始人与创作者的长篇对谈。"
 },
 "CRED curious": {
  "zh": "CRED curious",
  "host": "Kunal Shah",
  "en": "A conversation series from Indian fintech CRED, hosted by founder Kunal Shah, digging into how builders think.",
  "cn": "印度金融科技公司 CRED 的对谈系列，由创始人 Kunal Shah 主持，专注挖掘创业者的思考方式。"
 },
 "Huge If True": {
  "zh": "Huge If True",
  "host": "Cleo Abram",
  "en": "Optimistic, accessible explainers on technology and its future, hosted by former Vox video producer Cleo Abram.",
  "cn": "对技术及其未来的乐观、通俗解读，由前 Vox 视频制作人 Cleo Abram 主持。"
 },
 "WIRED": {
  "zh": "WIRED",
  "host": "",
  "en": "Talks and interviews from WIRED magazine, including its RE:WIRED conference on the future of technology.",
  "cn": "《连线》杂志的访谈与演讲，含其探讨技术未来的 RE:WIRED 大会。"
 },
 "Mind the Product": {
  "zh": "Mind the Product",
  "host": "",
  "en": "The global product management conference; its London and SF stages feature talks from product and design leaders.",
  "cn": "全球产品经理大会，伦敦与旧金山主会场汇集产品与设计负责人的演讲。"
 },
 "California College of the Arts": {
  "zh": "加州艺术学院",
  "host": "",
  "en": "Public talks and fireside chats hosted by California College of the Arts (CCA) in San Francisco.",
  "cn": "旧金山加州艺术学院（CCA）举办的公开讲座与炉边对谈。"
 },
 "Lawfare": {
  "zh": "Lawfare",
  "host": "",
  "en": "A platform covering legal and national security issues, with analysis and commentary.",
  "cn": "关注法律与国家安全议题的分析与评论平台。"
 },
 "Avec": {
  "zh": "Avec",
  "host": "Jason Yuan",
  "en": "A podcast where guests reply to cold emails live. Jason Yuan, ex-Apple designer, discusses Hivemind and design themes.",
  "cn": "播客节目，嘉宾现场回复陌生邮件。前苹果设计师Jason Yuan谈Hivemind及设计理念。"
 },
 "MTS ": {
  "zh": "MTS",
  "host": "MTS",
  "en": "A live news and interview show covering technology, business, politics and culture.",
  "cn": "一档直播新闻访谈节目，涵盖科技、商业、政治与文化。"
 },
 "Founders": {
  "zh": "Founders",
  "host": "David Senra",
  "en": "David Senra studies history's greatest founders, one biography per episode, distilling how they built and what it cost.",
  "cn": "David Senra 每期精读一部创始人传记,提炼史上最伟大创业者如何成事及其代价。"
 },
 "Sourcery with Molly O'Shea": {
  "zh": "Sourcery · 莫莉·奥谢",
  "host": "Molly O'Shea",
  "en": "VC Molly O'Shea interviews top investors, CEOs and founders on AI, deep tech and what venture capital is actually funding.",
  "cn": "风险投资人 Molly O'Shea 访谈一线投资人、CEO 与创始人，聊 AI、硬科技，以及风投真正在投什么。"
 },
 "Great Company with Jamie Laing": {
  "zh": "Great Company with Jamie Laing",
  "host": "Great Company with Jamie Laing",
  "en": "Great Company with Jamie Laing",
  "cn": "Great Company with Jamie Laing"
 },
 "Vision Economy": {
  "zh": "视觉经济",
  "host": "未知",
  "en": "Exploring the intersection of visual culture and economic trends, analyzing how images shape markets.",
  "cn": "探讨视觉文化与经济趋势的交汇，分析图像如何塑造市场。"
 },
 "Peter Yang": {
  "zh": "彼得·杨",
  "host": "Peter Yang",
  "en": "Peter Yang explores tech, business, and culture through insightful interviews and analysis.",
  "cn": "杨彼得通过深度访谈和分析，探讨科技、商业与文化。"
 },
 "How I AI": {
  "zh": "How I AI",
  "host": "How I AI",
  "en": "A podcast exploring the intersection of AI and human creativity, featuring interviews with innovators and thinkers.",
  "cn": "探索人工智能与人类创造力交汇的播客，采访创新者和思想家。"
 },
 "Giant Ideas": {
  "zh": "Giant Ideas",
  "host": "未知",
  "en": "A podcast exploring big ideas and innovations that shape our world, featuring interviews with thought leaders.",
  "cn": "探索塑造世界的宏大想法与创新，采访思想领袖的播客。"
 },
 "AI Native Dev": {
  "zh": "AI Native Dev",
  "host": "Simon Maple",
  "en": "AI Native Dev explores how engineering teams actually build with AI agents, with practitioners from the companies shipping them.",
  "cn": "AI Native Dev 与一线实践者探讨工程团队如何真正用 AI 智能体开发。"
 },
 "Tiger Sisters": {
  "zh": "虎姐妹",
  "host": "虎姐妹",
  "en": "Two sisters share their unfiltered takes on life, love, and Asian American identity.",
  "cn": "两姐妹畅谈生活、爱情与亚裔身份，观点犀利不设限。"
 },
 "The Futurology Podcast": {
  "zh": "Futurology 播客",
  "host": "Berggruen 研究院",
  "en": "The Futurology Podcast from the Berggruen Institute explores how technology reshapes what it means to be human, with thinkers and builders.",
  "cn": "Berggruen 研究院出品的 Futurology 播客，与思想者和建造者探讨技术如何重塑人之为人。"
 },
 "Colin and Samir": {
  "zh": "Colin and Samir",
  "host": "Colin Rosenblum & Samir Chaudry",
  "en": "Colin and Samir is the leading show about the creator economy, interviewing creators and the executives shaping online video.",
  "cn": "Colin and Samir 是创作者经济领域的头部节目，访谈创作者与塑造在线视频行业的高管。"
 },
 "Acquired": {
  "zh": "Acquired",
  "host": "Ben Gilbert & David Rosenthal",
  "en": "Acquired tells the stories and strategies of great companies, with deeply researched multi-hour episodes and landmark founder interviews.",
  "cn": "Acquired 讲述伟大公司的故事与战略，以数小时深度研究型剧集和标志性创始人访谈著称。"
 },
 "Newcomer": {
  "zh": "Newcomer",
  "host": "Eric Newcomer",
  "en": "Newcomer is Eric Newcomer&#39;s venture capital and startups newsletter and podcast, known for sharp interviews with founders and investors.",
  "cn": "Newcomer 是 Eric Newcomer 的创投 newsletter 与播客，以对创始人和投资人的犀利访谈著称。"
 },
 "Hay Festival": {
  "zh": "海伊文化节",
  "host": "Hay Festival",
  "en": "Hay Festival is a renowned literary festival in Wales, hosting conversations with writers, thinkers and innovators from around the world.",
  "cn": "海伊文化节是威尔士著名的文学节，汇聚全球作家、思想家与创新者的对谈。"
 },
 "Stanford (SIEPR)": {
  "zh": "斯坦福 SIEPR",
  "host": "斯坦福经济政策研究所",
  "en": "Talks and fireside chats from the Stanford Institute for Economic Policy Research, where economists and business leaders discuss policy and the economy.",
  "cn": "斯坦福经济政策研究所的对谈与炉边谈话，经济学家与商界领袖探讨政策与经济。"
 },
 "Cadence": {
  "zh": "Cadence",
  "host": "Cadence Design Systems",
  "en": "Official channel of Cadence Design Systems, featuring CadenceLIVE keynotes and conversations on EDA, semiconductors and AI.",
  "cn": "Cadence 官方频道，收录 CadenceLIVE 主题演讲与关于 EDA、半导体和 AI 的对谈。"
 },
 "Bloomberg Podcasts": {
  "zh": "彭博播客",
  "host": "彭博新闻社",
  "en": "Bloomberg Podcasts delivers daily business and finance news, market analysis, and expert insights from Bloomberg's global network.",
  "cn": "彭博播客提供每日商业和金融新闻、市场分析及全球专家见解。"
 },
 "The AI Why with Liam Lawson": {
  "zh": "AI为什么",
  "host": "Liam Lawson",
  "en": "Exploring AI's impact on society, ethics, and future through interviews with experts and thought leaders.",
  "cn": "通过采访专家和思想领袖，探讨人工智能对社会、伦理和未来的影响。"
 },
 "AI & Design Podcast": {
  "zh": "AI与设计播客",
  "host": "多位嘉宾",
  "en": "Exploring the intersection of artificial intelligence and design, featuring expert interviews and insights.",
  "cn": "探讨人工智能与设计的交汇点，包含专家访谈和深刻见解。"
 },
 "Parzival of Algorithmic Progress": {
  "zh": "算法进步帕西法尔",
  "host": "Parzival",
  "en": "Exploring AI, algorithms, and tech innovation with deep insights and critical analysis.",
  "cn": "深入探讨人工智能、算法与技术创新的播客，提供深刻见解与批判性分析。"
 },
 "Reid Hoffman": {
  "zh": "雷德·霍夫曼",
  "host": "雷德·霍夫曼",
  "en": "Reid Hoffman, LinkedIn co-founder, explores AI, tech, and society with top thinkers.",
  "cn": "领英联合创始人雷德·霍夫曼主持，探讨人工智能、科技与社会的前沿对话。"
 },
 "Dive Club": {
  "zh": "Dive Club",
  "host": "Ridd",
  "en": "A design-focused interview show hosted by Ridd — long-form conversations with the designers behind leading AI products.",
  "cn": "Ridd 主持的设计深访播客——对谈打造前沿 AI 产品的设计师们。"
 },
 "The a16z Podcast": {
  "zh": "a16z 播客",
  "host": "Andreessen Horowitz",
  "en": "Tech and culture insights from Andreessen Horowitz partners and guests.",
  "cn": "a16z播客由知名风投公司Andreessen Horowitz出品，探讨科技与文化前沿话题。"
 },
 "Lemonade Stand Clips": {
  "zh": "柠檬水摊剪辑",
  "host": "Lemonade Stand",
  "en": "Short clips from the Lemonade Stand podcast, covering tech, business, and culture with sharp insights.",
  "cn": "来自柠檬水摊播客的精选片段，涵盖科技、商业与文化，见解犀利。"
 },
 "Analyse Podcast": {
  "zh": "分析播客",
  "host": "未知",
  "en": "A podcast exploring data analysis, statistics, and insights from various fields.",
  "cn": "探索数据分析、统计学及各领域洞察的播客。"
 },
 "Complex": {
  "zh": "复杂",
  "host": "Complex Networks",
  "en": "Complex covers pop culture, sneakers, music, and streetwear with news, videos, and original series.",
  "cn": "Complex 专注于流行文化、球鞋、音乐和街头服饰，提供新闻、视频和原创系列。"
 },
 "New York Post": {
  "zh": "纽约邮报",
  "host": "纽约邮报",
  "en": "New York Post podcast covering news, politics, and pop culture with bold opinions and insider stories.",
  "cn": "纽约邮报播客，以大胆观点和内幕故事报道新闻、政治和流行文化。"
 },
 "Gradient Dissent": {
  "zh": "Gradient Dissent",
  "host": "Lukas Biewald（Weights & Biases）",
  "en": "The Weights & Biases podcast — Lukas Biewald and guests on how AI systems are really built, with founders and researchers.",
  "cn": "Weights & Biases 的播客,Lukas Biewald 对谈 AI 创业者与研究者,聊 AI 系统的真实构建。"
 },
 "WisdomTree in Europe": {
  "zh": "WisdomTree欧洲",
  "host": "WisdomTree",
  "en": "WisdomTree Europe podcast covers ETF investing, market trends, and economic insights for European investors.",
  "cn": "WisdomTree欧洲播客，为欧洲投资者提供ETF投资、市场趋势和经济洞察。"
 },
 "Stanford Department of Medicine": {
  "zh": "斯坦福医学院",
  "host": "斯坦福大学医学院",
  "en": "Stanford Medicine advances health through research, education, and clinical care, led by the Department of Medicine.",
  "cn": "斯坦福医学院通过研究、教育和临床护理促进健康，由医学系领导。"
 },
 "Hard Fork": {
  "zh": "Hard Fork",
  "host": "Kevin Roose & Casey Newton",
  "en": "The New York Times tech podcast — Kevin Roose and Casey Newton on AI and the future of the internet.",
  "cn": "《纽约时报》科技播客,Kevin Roose 与 Casey Newton 聊 AI 与互联网的未来。"
 },
 "Oprah": {
  "zh": "奥普拉",
  "host": "Oprah Winfrey",
  "en": "Oprah Winfrey's interview channel — rare mainstream sit-downs with technology leaders.",
  "cn": "奥普拉·温弗瑞的访谈频道——科技领袖罕见的大众向深谈。"
 },
 "Bg2 Pod": {
  "zh": "Bg2 Pod",
  "host": "Brad Gerstner & Bill Gurley",
  "en": "Brad Gerstner and Bill Gurley's podcast on tech, markets and AI — frequent frontier-lab CEO guests.",
  "cn": "Brad Gerstner 与 Bill Gurley 的科技/市场/AI 播客,常邀前沿实验室 CEO。"
 },
 "This Past Weekend": {
  "zh": "This Past Weekend",
  "host": "Theo Von",
  "en": "Comedian Theo Von's long-form show — unusually candid conversations, including with AI leaders.",
  "cn": "喜剧人 Theo Von 的长谈节目——异常坦诚的对话,也包括 AI 领袖。"
 },
 "Ryan Peterman": {
  "zh": "Ryan Peterman",
  "host": "Ryan Peterman",
  "en": "Ryan Peterman (ex-Meta staff engineer) interviews top engineers and builders about engineering careers and AI.",
  "cn": "Ryan Peterman（前 Meta 资深工程师）对谈顶尖工程师与建设者，聊工程职业与 AI。"
 },
 "Eric Jorgenson": {
  "zh": "Eric Jorgenson",
  "host": "Eric Jorgenson",
  "en": "Eric Jorgenson, author of The Almanack of Naval Ravikant, hosts long-form conversations on wealth, judgment and technology.",
  "cn": "《纳瓦尔宝典》作者 Eric Jorgenson 的长谈节目，聊财富、判断力与技术。"
 },
 "AI News & Podcast": {
  "zh": "AI新闻与播客",
  "host": "AI News & Podcast",
  "en": "Daily AI news and interviews with experts, covering breakthroughs, ethics, and industry trends.",
  "cn": "每日AI新闻与专家访谈，涵盖突破、伦理和行业趋势。"
 },
 "Simon Sinek": {
  "zh": "西蒙·斯涅克",
  "host": "Simon Sinek",
  "en": "Leadership expert and author of 'Start With Why', inspiring purpose-driven action.",
  "cn": "领导力专家、《从为什么开始》作者，激励人们以目标为导向行动。"
 },
 "Sequoia Capital": {
  "zh": "红杉资本",
  "host": "红杉资本",
  "en": "Sequoia Capital podcast: insights from top venture capitalists on startups, tech trends, and investment strategies.",
  "cn": "红杉资本播客：顶级风投分享创业、科技趋势与投资策略的见解。"
 },
 "CNA": {
  "zh": "CNA",
  "host": "CNA",
  "en": "Channel NewsAsia — Singapore-based English news network; long-form interviews with global leaders in tech and business.",
  "cn": "新加坡英文新闻台 CNA，对谈科技与商业领域的全球领袖。"
 },
 "This Week in AI": {
  "zh": "This Week in AI",
  "host": "This Week in AI",
  "en": "A weekly show with candid, long-form conversations with the founders and builders shaping AI.",
  "cn": "每周一期，与塑造 AI 的创始人和建设者深度对谈。"
 },
 "Finoverse": {
  "zh": "Finoverse",
  "host": "Finoverse",
  "en": "Finoverse hosts conversations on AI and frontier tech across Asia and the world, from its base in Hong Kong.",
  "cn": "Finoverse 立足香港，对谈亚洲与全球的 AI 与前沿科技。"
 },
 "James Altucher": {
  "zh": "詹姆斯·阿尔图彻",
  "host": "詹姆斯·阿尔图彻",
  "en": "James Altucher shares insights on success, failure, and happiness through interviews and solo episodes.",
  "cn": "詹姆斯·阿尔图彻通过访谈和个人分享探讨成功、失败与幸福。"
 },
 "CNN": {
  "zh": "CNN",
  "host": "CNN",
  "en": "Interviews and features from CNN, the American cable news network.",
  "cn": "美国有线电视新闻网 CNN 的访谈与专题报道。"
 },
 "Bloomberg Live": {
  "zh": "彭博直播",
  "host": "Bloomberg",
  "en": "Live conversations from Bloomberg events — leaders on markets, tech and power.",
  "cn": "彭博活动现场对谈——领袖谈市场、科技与权力。"
 },
 "Nobel Prize": {
  "zh": "诺贝尔奖官方",
  "host": "Nobel Prize Outreach",
  "en": "The official Nobel Prize channel — laureates in conversation about their science and its future.",
  "cn": "诺贝尔奖官方频道——得主对谈，聊他们的科学与未来。"
 },
 "MIT IMES": {
  "zh": "MIT IMES 讲座",
  "host": "MIT IMES",
  "en": "Distinguished speaker series from the MIT Institute for Medical Engineering & Science.",
  "cn": "MIT 医学工程与科学研究所的杰出讲者系列。"
 },
 "ACM ByteCast": {
  "zh": "ACM ByteCast",
  "host": "ACM",
  "en": "The Association for Computing Machinery podcast — computing pioneers on their journeys.",
  "cn": "美国计算机学会（ACM）播客——计算先驱聊来路与远方。"
 },
 "Bain Capital Ventures": {
  "zh": "Bain Capital Ventures",
  "host": "BCV",
  "en": "Conversations with founders and researchers from Bain Capital Ventures.",
  "cn": "Bain Capital Ventures 的创始人与研究者对谈。"
 },
 "ANI News": {
  "zh": "ANI 新闻",
  "host": "ANI",
  "en": "Asian News International — interviews and coverage from India's largest news agency.",
  "cn": "亚洲国际新闻社（ANI）——印度最大通讯社的访谈与报道。"
 },
 "Princeton University": {
  "zh": "普林斯顿大学",
  "host": "Princeton CS",
  "en": "Lectures and colloquia from Princeton University, including the CS distinguished series.",
  "cn": "普林斯顿大学讲座与学术报告，含计算机系杰出报告系列。"
 },
 "Tetragrammaton": {
  "zh": "Tetragrammaton",
  "host": "Rick Rubin",
  "en": "Music producer Rick Rubin hosts wide-ranging conversations with creators, technologists and thinkers about craft, taste and the creative process.",
  "cn": "音乐制作人 Rick Rubin 主持，与创作者、技术人、思想者漫谈手艺、品味与创作过程。"
 },
 "Stanford Online": {
  "zh": "斯坦福公开课",
  "host": "Stanford Online",
  "en": "Stanford Online publishes course lectures and seminars, including the CS25 Transformers series where researchers present frontier work.",
  "cn": "斯坦福在线发布课程讲座与研讨，包括 CS25 Transformers 系列——研究者在此讲解前沿工作。"
 },
 "Stanford AI Club": {
  "zh": "斯坦福 AI 俱乐部",
  "host": "Stanford AI Club",
  "en": "Talks and conversations hosted by the Stanford AI Club, featuring researchers on the ideas shaping modern AI.",
  "cn": "斯坦福 AI 俱乐部主办的讲座与对谈，邀请研究者分享塑造现代 AI 的思路。"
 },
 "BuzzRobot": {
  "zh": "BuzzRobot",
  "host": "BuzzRobot · Sophia Arakelyan",
  "en": "BuzzRobot hosts in-depth talks from AI researchers on frontier topics like world models and reinforcement learning.",
  "cn": "BuzzRobot 邀请 AI 研究者做前沿主题（世界模型、强化学习等）的深度分享。"
 },
 "Sean C. Stephens": {
  "zh": "Sean C. Stephens",
  "host": "Sean C. Stephens",
  "en": "Sean Stephens explores tech, business, and personal growth through insightful conversations and practical advice.",
  "cn": "Sean Stephens 通过富有洞察力的对话和实用建议，探讨科技、商业和个人成长。"
 },
 "Claude": {
  "zh": "Claude 官方",
  "host": "Anthropic",
  "en": "The official Anthropic channel — conversations with the researchers and builders behind Claude on how it is made and where it is going.",
  "cn": "Anthropic 官方频道——与 Claude 背后的研究者、构建者对谈，聊它如何打造、走向何方。"
 },
 "Anthropic": {
  "zh": "Anthropic 官方",
  "host": "Anthropic",
  "en": "The main Anthropic channel — researchers and staff explain alignment, interpretability and the ideas behind Claude.",
  "cn": "Anthropic 官方主频道——研究者与员工讲解对齐、可解释性以及 Claude 背后的思路。"
 },
 "The OpenAI Podcast": {
  "zh": "OpenAI 播客",
  "host": "OpenAI · Andrew Mayne",
  "en": "The official OpenAI podcast — host Andrew Mayne talks with OpenAI researchers and leaders about how the models work and where they are headed.",
  "cn": "OpenAI 官方播客——主持人 Andrew Mayne 与 OpenAI 研究者、负责人对谈，聊模型如何运作、走向何方。"
 },
 "PowerfulJRE": {
  "zh": "乔·罗根体验",
  "host": "乔·罗根",
  "en": "Joe Rogan hosts long-form conversations with diverse guests on comedy, science, and culture.",
  "cn": "乔·罗根主持的长篇对话节目，涵盖喜剧、科学、文化等多元话题。"
 },
 "iAfrikan Media ": {
  "zh": "iAfrikan 媒体",
  "host": "iAfrikan Media",
  "en": "iAfrikan Media covers African tech, startups, and innovation, providing news and analysis for the continent's digital ecosystem.",
  "cn": "iAfrikan 媒体关注非洲科技、初创企业和创新，为非洲数字生态系统提供新闻与分析。"
 },
 "Institute for Pure & Applied Mathematics (IPAM)": {
  "zh": "纯数学与应用数学研究所",
  "host": "IPAM",
  "en": "IPAM fosters interdisciplinary research in mathematics and its applications through programs, workshops, and public lectures.",
  "cn": "IPAM 通过项目、研讨会和公开讲座促进数学及其应用的跨学科研究。"
 },
 "The Tim Ferriss Show": {
  "zh": "蒂姆·费里斯秀",
  "host": "Tim Ferriss",
  "en": "Tim Ferriss deconstructs world-class performers to extract tools and routines listeners can use.",
  "cn": "蒂姆·费里斯拆解世界级高手，提炼可复用的工具与习惯。"
 },
 "Modern Wisdom": {
  "zh": "现代智慧",
  "host": "Chris Williamson",
  "en": "Chris Williamson's long-form conversations on psychology, philosophy and living well.",
  "cn": "Chris Williamson 的长谈节目，聚焦心理学、哲学与更好地生活。"
 },
 "Naval": {
  "zh": "纳瓦尔播客",
  "host": "Naval Ravikant & Nivi",
  "en": "Naval Ravikant's own podcast — dense, aphoristic takes on wealth, judgment and technology.",
  "cn": "纳瓦尔自己的播客——关于财富、判断力与技术的高密度洞见。"
 },
 "AI & I": {
  "zh": "AI & I",
  "host": "Dan Shipper · Every",
  "en": "Every's Dan Shipper interviews builders about how they actually use AI in their work.",
  "cn": "Every 的 Dan Shipper 访谈一线构建者，聊他们实际如何用 AI 工作。"
 },
 "CMU Robotics Institute": {
  "zh": "CMU 机器人研究所",
  "host": "Carnegie Mellon RI",
  "en": "Research seminars from Carnegie Mellons Robotics Institute.",
  "cn": "卡内基梅隆大学机器人研究所的研究讲座。"
 },
 "The Generalist": {
  "zh": "The Generalist",
  "host": "Mario Gabriele",
  "en": "Mario Gabriels long-form interviews with the builders behind frontier technology companies.",
  "cn": "Mario Gabriele 对前沿科技公司构建者的长访谈。"
 },
 "Imbue": {
  "zh": "Imbue",
  "host": "Imbue · Kanjun Qiu",
  "en": "Long-form conversations from Imbue on building capable, reliable AI agents.",
  "cn": "Imbue 出品的长访谈，聚焦打造可靠、有能力的 AI 智能体。"
 },
 "Sparks of AGI": {
  "zh": "Sparks of AGI（MIT 演讲）",
  "host": "Sébastien Bubeck · MIT",
  "en": "Sébastien Bubecks landmark MIT talk on early experiments with GPT-4.",
  "cn": "塞巴斯蒂安·布贝克在 MIT 关于 GPT-4 早期实验的里程碑演讲。"
 },
 "Stanford MedAI": {
  "zh": "斯坦福 MedAI 讲座",
  "host": "Stanford MedAI Group",
  "en": "Stanford research seminar series on AI and medicine.",
  "cn": "斯坦福关于 AI 与医学的研究讲座系列。"
 },
 "The TWIML AI Podcast": {
  "zh": "TWIML AI 播客",
  "host": "Sam Charrington",
  "en": "Sam Charringtons long-running interview show on machine learning and AI, with researchers and practitioners.",
  "cn": "Sam Charrington 的长青访谈节目，对话机器学习与 AI 领域的研究者和从业者。"
 },
 "AI Agent Frontier": {
  "zh": "AI Agent 前沿",
  "host": "AI Agent Frontier",
  "en": "Exploring the latest in AI agents, autonomy, and multi-agent systems.",
  "cn": "探索 AI 智能体、自主性与多智能体系统的最新前沿。"
 },
 "Before AGI": {
  "zh": "AGI 之前",
  "host": "未指定",
  "en": "Exploring the path to Artificial General Intelligence, its implications, and the future of humanity.",
  "cn": "探讨通往通用人工智能之路、其影响及人类未来。"
 },
 "Outset Capital": {
  "zh": "Outset Capital",
  "host": "Outset Capital",
  "en": "Outset Capital is a venture capital firm investing in early-stage startups.",
  "cn": "Outset Capital 是一家投资早期初创企业的风险投资公司。"
 },
 "Relentless": {
  "zh": "不屈不挠",
  "host": "未知",
  "en": "A podcast about perseverance and overcoming challenges, featuring inspiring stories and interviews.",
  "cn": "关于毅力与克服挑战的播客，分享励志故事与访谈。"
 },
 "Upstarts Media": {
  "zh": "新贵传媒",
  "host": "Upstarts Media",
  "en": "Upstarts Media covers disruptive startups, tech trends, and entrepreneurial stories.",
  "cn": "新贵传媒聚焦颠覆性初创企业、科技趋势与创业故事。"
 },
 "@Scale": {
  "zh": "Scale AI",
  "host": "Scale AI",
  "en": "Scale AI podcast explores AI innovation, data labeling, and machine learning with industry leaders.",
  "cn": "Scale AI 播客探讨 AI 创新、数据标注及机器学习，与行业领袖对话。"
 },
 "The Knowledge Project Podcast": {
  "zh": "知识项目播客",
  "host": "Shane Parrish",
  "en": "Explore mental models, decision-making, and learning from top thinkers to improve your thinking and life.",
  "cn": "探讨思维模型、决策与学习，向顶尖思想家学习，提升思维与生活。"
 },
 "Associated Press": {
  "zh": "美联社",
  "host": "美联社",
  "en": "Global news agency delivering breaking news, in-depth reporting, and multimedia content.",
  "cn": "全球新闻机构，提供突发新闻、深度报道和多媒体内容。"
 },
 "Bloomberg Originals": {
  "zh": "彭博原创",
  "host": "彭博社",
  "en": "Bloomberg Originals produces documentaries and series on business, finance, and global affairs.",
  "cn": "彭博原创制作关于商业、金融和全球事务的纪录片和系列节目。"
 },
 "NothingButTech": {
  "zh": "NothingButTech",
  "host": "NothingButTech",
  "en": "A podcast exploring the latest in technology, innovation, and digital trends with expert insights.",
  "cn": "专注科技、创新与数字趋势的播客，提供专家见解。"
 },
 "ARC Prize": {
  "zh": "ARC Prize",
  "host": "François Chollet",
  "en": "A podcast exploring the ARC challenge, AI reasoning, and the path to human-level machine intelligence.",
  "cn": "探讨 ARC 挑战、AI 推理及通往人类级机器智能之路的播客。"
 },
 "Casey Newton": {
  "zh": "Casey Newton",
  "host": "Casey Newton",
  "en": "Tech journalist covering social media, platforms, and internet culture. Host of Hard Fork podcast.",
  "cn": "科技记者，关注社交媒体、平台和网络文化。主持《Hard Fork》播客。"
 },
 "Stanford Graduate School of Business": {
  "zh": "斯坦福商学院",
  "host": "斯坦福大学商学院",
  "en": "Stanford GSB offers insights from faculty and leaders on business, innovation, and leadership.",
  "cn": "斯坦福商学院提供来自教授和领导者的商业、创新和领导力见解。"
 },
 "Alex Kantrowitz": {
  "zh": "Alex Kantrowitz",
  "host": "Alex Kantrowitz",
  "en": "Tech journalist analyzing Big Tech, media, and culture through interviews and insights.",
  "cn": "科技记者，通过访谈和洞察分析大型科技公司、媒体与文化。"
 },
 "Computer Vision and Geometry Group, ETH Zurich": {
  "zh": "苏黎世联邦理工学院计算机视觉与几何组",
  "host": "苏黎世联邦理工学院",
  "en": "Research group at ETH Zurich focusing on computer vision, geometry, and machine learning.",
  "cn": "苏黎世联邦理工学院研究组，专注计算机视觉、几何与机器学习。"
 },
 "Aarthi and Sriram Show": {
  "zh": "Aarthi 和 Sriram 秀",
  "host": "Aarthi Ramamurthy 和 Sriram Krishnan",
  "en": "Tech podcast by investors Aarthi Ramamurthy and Sriram Krishnan on tech, startups, and AI.",
  "cn": "投资人 Aarthi 和 Sriram 主持的科技播客，讨论科技、创业和 AI。"
 },
 "NVIDIA": {
  "zh": "英伟达",
  "host": "英伟达官方",
  "en": "Official NVIDIA channel covering AI, accelerated computing, and fireside chats with researchers.",
  "cn": "英伟达官方频道，涵盖 AI、加速计算及与研究人员炉边对话。"
 },
 "Silicon Valley Girl": {
  "zh": "硅谷女孩",
  "host": "Marina Mogilko",
  "en": "Creator Marina Mogilko's channel featuring interviews with tech founders and CEOs.",
  "cn": "创作者 Marina Mogilko 的频道，采访科技创始人和 CEO。"
 },
 "The Robot Brains": {
  "zh": "机器人脑",
  "host": "Pieter Abbeel",
  "en": "Podcast hosted by Pieter Abbeel on AI and robotics with leading researchers.",
  "cn": "Pieter Abbeel 主持的播客，与顶尖研究者探讨 AI 和机器人。"
 },
 "AI Proem": {
  "zh": "AI 序曲",
  "host": "AI Proem",
  "en": "In-depth conversations on AI research and the labs building it.",
  "cn": "深度对话 AI 研究及构建它的实验室。"
 },
 "All-In Podcast": {
  "zh": "全押播客",
  "host": "Chamath, Sacks, Friedberg, Calacanis",
  "en": "Roundtable by tech investors on tech, markets, and politics.",
  "cn": "科技投资者圆桌讨论科技、市场与政治。"
 },
 "CNBC": {
  "zh": "CNBC",
  "host": "CNBC",
  "en": "Global business and markets news network.",
  "cn": "全球商业与市场新闻网络。"
 },
 "Center for Humane Technology": {
  "zh": "人道技术中心",
  "host": "Tristan Harris",
  "en": "Nonprofit with podcast Your Undivided Attention on tech's societal impact.",
  "cn": "非营利组织，播客《你的全神贯注》关注技术社会影响。"
 },
 "Google DeepMind": {
  "zh": "谷歌 DeepMind",
  "host": "Google DeepMind",
  "en": "Official channel of Google DeepMind AI research lab.",
  "cn": "谷歌 DeepMind 人工智能研究实验室官方频道。"
 },
 "Matthew Berman": {
  "zh": "马修·伯曼",
  "host": "Matthew Berman",
  "en": "AI-focused creator with interviews and explainers on frontier models.",
  "cn": "AI 创作者，访谈与解说前沿模型。"
 },
 "Shawn Ryan Show": {
  "zh": "肖恩·瑞恩秀",
  "host": "Shawn Ryan",
  "en": "Long-form interviews with big personalities in tech, defense, culture.",
  "cn": "长篇访谈科技、国防、文化领域大人物。"
 },
 "Sinead Bovell": {
  "zh": "西尼德·博维尔",
  "host": "Sinead Bovell",
  "en": "Futurist translating AI and emerging tech for broad audience.",
  "cn": "未来学家，为大众解读 AI 与新兴科技。"
 },
 "Stanford Digital Economy Lab": {
  "zh": "斯坦福数字经济实验室",
  "host": "Stanford Digital Economy Lab",
  "en": "Talks and lectures from Stanford University.",
  "cn": "斯坦福大学的演讲与讲座。"
 },
 "TBPN": {
  "zh": "TBPN",
  "host": "TBPN",
  "en": "Live tech-business talk show on startups, AI, and markets.",
  "cn": "直播科技商业脱口秀，聚焦创业、AI 与市场。"
 },
 "TED": {
  "zh": "TED",
  "host": "TED",
  "en": "Talks on ideas worth spreading across science, tech, culture.",
  "cn": "传播值得分享的思想，涵盖科学、科技、文化。"
 },
 "The Economic Times": {
  "zh": "经济时报",
  "host": "The Economic Times",
  "en": "India's leading business news outlet with Davos/AI interviews.",
  "cn": "印度领先商业新闻媒体，达沃斯/AI 访谈。"
 },
 "The Information Bottleneck": {
  "zh": "信息瓶颈",
  "host": "The Information Bottleneck",
  "en": "Deep-dive podcast on AI research and the people behind it.",
  "cn": "深度播客，探讨 AI 研究及其背后人物。"
 },
 "The Pragmatic Engineer": {
  "zh": "务实工程师",
  "host": "Gergely Orosz",
  "en": "Software engineering podcast on how top engineers and teams build.",
  "cn": "软件工程播客，揭秘顶尖工程师与团队如何构建。"
 },
 "The Royal Institution": {
  "zh": "皇家研究院",
  "host": "The Royal Institution",
  "en": "Historic UK science institution famous for public lectures.",
  "cn": "英国历史悠久的科学机构，以公众讲座闻名。"
 },
 "Tucker Carlson": {
  "zh": "塔克·卡尔森",
  "host": "Tucker Carlson",
  "en": "Long-form interview show.",
  "cn": "长篇访谈节目。"
 },
 "Turing Post": {
  "zh": "图灵邮报",
  "host": "Turing Post",
  "en": "AI newsletter and podcast on history and frontier of machine learning.",
  "cn": "AI 新闻通讯与播客，聚焦机器学习历史与前沿。"
 },
 "Dwarkesh Podcast": {
  "zh": "Dwarkesh 播客",
  "host": "Dwarkesh Patel",
  "url": "https://www.dwarkesh.com",
  "en": "Long-form, deeply researched interviews on AI, history, and economics. Host Dwarkesh Patel is known for technical depth and pushing guests hard.",
  "cn": "关于 AI、历史与经济的长篇深度访谈。主持人 Dwarkesh Patel 以技术深度，以及对嘉宾的「穷追猛打」著称。"
 },
 "Cheeky Pint": {
  "zh": "Cheeky Pint",
  "host": "John Collison · Stripe",
  "en": "Stripe co-founder John Collison talks shop with founders and operators over a pint.",
  "cn": "Stripe 联合创始人 John Collison 就着一杯啤酒，与创始人和经营者们聊行业。"
 },
 "Interesting Times": {
  "zh": "Interesting Times",
  "host": "Ross Douthat · NYT",
  "en": "New York Times opinion columnist Ross Douthat in conversation about politics, culture, and technology.",
  "cn": "《纽约时报》观点专栏作家 Ross Douthat 关于政治、文化与技术的对谈。"
 },
 "No Priors": {
  "zh": "No Priors 播客",
  "host": "Sarah Guo & Elad Gil",
  "en": "Investors Sarah Guo and Elad Gil interview the builders shaping AI.",
  "cn": "投资人 Sarah Guo 与 Elad Gil 访谈正在塑造 AI 的建造者们。"
 },
 "Training Data": {
  "zh": "Training Data",
  "host": "Sequoia Capital · 红杉",
  "en": "Sequoia Capital’s podcast on the people and ideas building the AI future.",
  "cn": "红杉资本的播客，聚焦正在构建 AI 未来的人与想法。"
 },
 "Lenny’s Podcast": {
  "zh": "Lenny’s Podcast",
  "host": "Lenny Rachitsky",
  "en": "Deep dives on product, growth, and career with leaders across tech, hosted by Lenny Rachitsky.",
  "cn": "由 Lenny Rachitsky 主持，与科技界领袖深聊产品、增长与职业发展。"
 },
 "Latent Space": {
  "zh": "Latent Space",
  "host": "swyx & Alessio Fanelli",
  "en": "The podcast for AI engineers — technical conversations on building with LLMs.",
  "cn": "面向 AI 工程师的播客——关于用 LLM 构建产品的技术对谈。"
 },
 "80,000 Hours": {
  "zh": "80,000 小时",
  "host": "80,000 Hours",
  "en": "Long, rigorous interviews on the world’s most pressing problems — including AI safety — from the effective-altruism org 80,000 Hours.",
  "cn": "来自有效利他主义组织 80,000 Hours 的长篇、严谨访谈，议题涵盖 AI 安全等当今最紧迫的问题。"
 },
 "The Diary Of A CEO": {
  "zh": "The Diary Of A CEO",
  "host": "Steven Bartlett",
  "en": "Steven Bartlett’s wide-reaching interview show on business, life, and big ideas.",
  "cn": "Steven Bartlett 的访谈节目，广泛触及商业、人生与重大议题。"
 },
 "StarTalk": {
  "zh": "StarTalk",
  "host": "Neil deGrasse Tyson",
  "en": "Astrophysicist Neil deGrasse Tyson blends science, pop culture, and humor.",
  "cn": "天体物理学家 Neil deGrasse Tyson 把科学、流行文化与幽默融为一体。"
 },
 "The Weekly Show": {
  "zh": "The Weekly Show",
  "host": "Jon Stewart",
  "en": "Jon Stewart’s conversations on politics, media, and society.",
  "cn": "Jon Stewart 关于政治、媒体与社会的对谈。"
 },
 "Unsupervised Learning": {
  "zh": "Unsupervised Learning",
  "host": "Jacob Effron · Redpoint",
  "en": "Redpoint’s Jacob Effron interviews the founders and researchers building frontier AI.",
  "cn": "Redpoint 的 Jacob Effron 访谈构建前沿 AI 的创始人与研究者。"
 },
 "This Is The World": {
  "zh": "This Is The World",
  "host": "",
  "en": "An interview series featuring leading voices in AI and technology.",
  "cn": "聚焦 AI 与科技领域重要声音的访谈系列。"
 },
 "Decoder": {
  "zh": "Decoder",
  "host": "Nilay Patel · The Verge",
  "en": "The Verge’s Nilay Patel decodes how leaders make decisions and how organizations really work.",
  "cn": "The Verge 的 Nilay Patel 拆解领导者如何决策、组织究竟如何运转。"
 },
 "Big Technology": {
  "zh": "Big Technology 播客",
  "host": "Alex Kantrowitz",
  "en": "Alex Kantrowitz’s level-headed interviews on Big Tech and AI, cutting through the hype.",
  "cn": "Alex Kantrowitz 冷静、去泡沫的大科技与 AI 访谈。"
 },
 "20VC": {
  "zh": "20VC 创投播客",
  "host": "Harry Stebbings",
  "en": "Harry Stebbings (The Twenty Minute VC) interviews top founders and investors across tech and AI.",
  "cn": "Harry Stebbings（The Twenty Minute VC）访谈科技与 AI 领域的顶尖创始人与投资人。"
 },
 "The Joe Rogan Experience": {
  "zh": "Joe Rogan Experience",
  "host": "Joe Rogan",
  "en": "Joe Rogan's marathon, free-ranging conversations; his AI and tech guests reach a huge mainstream audience.",
  "cn": "Joe Rogan 马拉松式、天马行空的长谈；他的 AI 与科技嘉宾触达极广的大众听众。"
 },
 "The MAD Podcast": {
  "zh": "Matt Turck 的 MAD 播客",
  "host": "Matt Turck · FirstMark",
  "en": "VC Matt Turck (FirstMark) interviews the builders of the ML / AI / Data (\"MAD\") landscape.",
  "cn": "风险投资人 Matt Turck（FirstMark）访谈「机器学习 / AI / 数据（MAD）」版图的建造者们。"
 },
 "Interconnects": {
  "zh": "Interconnects",
  "host": "Nathan Lambert · Ai2",
  "en": "Nathan Lambert (Ai2) on open models, RL, and the frontier of AI research.",
  "cn": "Nathan Lambert（Ai2）谈开放模型、强化学习，以及 AI 研究的前沿。"
 },
 "Core Memory": {
  "zh": "Core Memory 播客",
  "host": "Ashlee Vance",
  "en": "Journalist Ashlee Vance (Musk biographer) on deep tech, AI, and the people building the future.",
  "cn": "记者 Ashlee Vance（马斯克传记作者）谈硬科技、AI，以及那些正在构建未来的人。"
 },
 "Y Combinator": {
  "zh": "Y Combinator",
  "host": "Y Combinator",
  "en": "Y Combinator's conversations with the founders and researchers building the future, including OpenAI early talks.",
  "cn": "Y Combinator 与构建未来的创始人、研究者的对谈，含 OpenAI 早期演讲。"
 },
 "Public Lecture": {
  "zh": "公开讲座",
  "host": "Public Lecture",
  "en": "Public lectures and keynotes by AI pioneers — the earliest recorded thinking, before the podcast era.",
  "cn": "AI 先驱的公开讲座与主题演讲——播客时代之前，最早被记录下来的思考。"
 },
 "Deep Learning Lecture": {
  "zh": "深度学习公开课",
  "host": "Lecture",
  "en": "Foundational deep-learning lectures from the field's founders.",
  "cn": "来自领域奠基者的深度学习基础公开课。"
 },
 "ML Lecture": {
  "zh": "机器学习公开课",
  "host": "Lecture",
  "en": "Technical machine-learning course lectures.",
  "cn": "机器学习课程的技术讲授。"
 },
 "OpenEd Keynote": {
  "zh": "OpenEd 主题演讲",
  "host": "Keynote",
  "en": "Keynote talks on learning, education, and machine intelligence.",
  "cn": "关于学习、教育与机器智能的主题演讲。"
 },
 "Lex Fridman Podcast": {
  "zh": "Lex Fridman 播客",
  "host": "Lex Fridman",
  "en": "Long-form conversations on AI, science, power, and the human condition.",
  "cn": "关于 AI、科学、权力与人之境况的长篇对谈。"
 },
 "Machine Learning Street Talk": {
  "zh": "ML Street Talk",
  "host": "Tim Scarfe 等",
  "en": "In-depth, technical debates on machine learning and the foundations of intelligence.",
  "cn": "深入、硬核的机器学习与智能本质技术辩论。"
 },
 "The Cognitive Revolution": {
  "zh": "The Cognitive Revolution",
  "host": "Nathan Labenz",
  "en": "Practitioner-focused interviews on how AI is actually being built and used.",
  "cn": "以实践者视角，谈 AI 究竟如何被构建与使用。"
 },
 "In Good Company": {
  "zh": "In Good Company",
  "host": "Nicolai Tangen · Norges Bank",
  "en": "The CEO of the world's largest sovereign wealth fund interviews top leaders.",
  "cn": "全球最大主权基金 CEO 访谈顶尖领袖。"
 },
 "Intelligence Squared": {
  "zh": "Intelligence Squared",
  "host": "Intelligence Squared",
  "en": "Debates and interviews on the big ideas shaping the world.",
  "cn": "围绕塑造世界的重大议题的辩论与访谈。"
 },
 "This Week in Startups": {
  "zh": "This Week in Startups",
  "host": "Jason Calacanis",
  "en": "Startups, venture, and the technology shaping the future, hosted by Jason Calacanis.",
  "cn": "Jason Calacanis 主持，谈创业、风投与塑造未来的技术。"
 },
 "Young and Profiting": {
  "zh": "Young and Profiting",
  "host": "Hala Taha",
  "en": "Hala Taha interviews leaders on business, growth, and how they think.",
  "cn": "Hala Taha 访谈各界领袖，谈商业、成长与思维方式。"
 },
 "Microsoft": {
  "zh": "Microsoft",
  "host": "Microsoft",
  "en": "Microsoft's own conversations on AI, products, and the future of work.",
  "cn": "微软官方关于 AI、产品与未来工作方式的对谈。"
 },
 "Sana": {
  "zh": "Sana",
  "host": "Sana",
  "en": "Conversations on AI and the future of knowledge work.",
  "cn": "关于 AI 与知识工作未来的对谈。"
 },
 "The Trajectory": {
  "zh": "The Trajectory",
  "host": "Daniel Faggella",
  "en": "Long-horizon conversations on AGI, power, and the trajectory of intelligence.",
  "cn": "关于 AGI、权力与智能长期走向的对谈。"
 },
 "Super Data Science": {
  "zh": "Super Data Science",
  "host": "Jon Krohn",
  "en": "Jon Krohn's practitioner podcast on data science, ML, and AI careers.",
  "cn": "Jon Krohn 面向实践者，谈数据科学、机器学习与 AI 职业。"
 },
 "The Logan Bartlett Show": {
  "zh": "The Logan Bartlett Show",
  "host": "Logan Bartlett · Redpoint",
  "en": "Candid conversations with the founders and operators building tech.",
  "cn": "与构建科技的创始人、经营者的坦诚对谈。"
 },
 "South Park Commons": {
  "zh": "South Park Commons",
  "host": "South Park Commons",
  "en": "Builders and founders at the earliest, idea stage.",
  "cn": "聚焦最早期、想法阶段的建造者与创始人。"
 },
 "Edan Meyer": {
  "zh": "Edan Meyer",
  "host": "Edan Meyer",
  "en": "AI researcher Edan Meyer's interviews and explainers on RL and ML.",
  "cn": "AI 研究者 Edan Meyer 关于强化学习与机器学习的访谈与讲解。"
 },
 "The Economist": {
  "zh": "经济学人",
  "host": "The Economist",
  "en": "The Economist's video channel — long-form interviews and analysis on global politics, business and technology.",
  "cn": "《经济学人》视频频道，围绕全球政治、商业与科技的长访谈与分析。"
 },
 "Financial Times": {
  "zh": "金融时报",
  "host": "Financial Times",
  "en": "The Financial Times' video channel; its FT Interview series puts editors in conversation with business and policy leaders.",
  "cn": "《金融时报》视频频道，FT Interview 系列由主编对话商业与政策领袖。"
 },
 "Axios": {
  "zh": "Axios",
  "host": "Axios",
  "en": "Axios' video channel — its co-founders and reporters interview newsmakers in politics, business and technology.",
  "cn": "Axios 视频频道，由联合创始人与记者对话政商科技领域的当事人。"
 },
 "WSJ at Davos": {
  "zh": "华尔街日报 · 达沃斯",
  "host": "The Wall Street Journal",
  "en": "The Wall Street Journal's on-stage interviews recorded at the World Economic Forum in Davos.",
  "cn": "《华尔街日报》在达沃斯世界经济论坛现场的舞台访谈。"
 },
 "Semafor Tech": {
  "zh": "Semafor 科技",
  "host": "Semafor",
  "en": "Semafor's technology coverage — interviews with the executives and researchers driving the AI industry.",
  "cn": "Semafor 的科技报道线，对话推动 AI 产业的高管与研究者。"
 },
 "The Circuit (Bloomberg)": {
  "zh": "The Circuit（彭博）",
  "host": "Emily Chang",
  "en": "Bloomberg Originals series in which Emily Chang profiles the people and companies shaping technology.",
  "cn": "彭博 Originals 出品，由 Emily Chang 深度走访塑造科技业的人与公司。"
 },
 "Radio Davos (World Economic Forum)": {
  "zh": "Radio Davos（世界经济论坛）",
  "host": "World Economic Forum",
  "en": "The World Economic Forum's podcast on the issues shaping the global agenda, including AI and its governance.",
  "cn": "世界经济论坛的播客，讨论塑造全球议程的议题，涵盖 AI 及其治理。"
 },
 "Invest Like The Best": {
  "zh": "Invest Like The Best",
  "host": "Patrick O'Shaughnessy",
  "en": "Patrick O'Shaughnessy interviews investors, founders and operators about how they think and allocate.",
  "cn": "Patrick O'Shaughnessy 对话投资人、创始人与经营者，聊他们如何思考与配置资源。"
 },
 "Masters of Scale": {
  "zh": "Masters of Scale",
  "host": "Reid Hoffman",
  "en": "Reid Hoffman's series on how companies scale; its Summit stage sessions feature founders and AI leaders.",
  "cn": "Reid Hoffman 关于公司如何规模化的系列，其 Summit 舞台环节邀请创始人与 AI 领袖对谈。"
 },
 "People by WTF": {
  "zh": "People by WTF",
  "host": "Nikhil Kamath",
  "en": "Zerodha co-founder Nikhil Kamath's interview series with founders, investors and thinkers.",
  "cn": "Zerodha 联合创始人 Nikhil Kamath 的访谈系列，对话创始人、投资人与思想者。"
 },
 "1st10 Podcast": {
  "zh": "1st10 播客",
  "host": "Boris Epstein",
  "en": "Boris Epstein talks with operators and AI leaders about the first ten hires and early-stage company building.",
  "cn": "Boris Epstein 对话经营者与 AI 领袖，聊最初十位员工与早期公司搭建。"
 },
 "Moonshots with Peter Diamandis": {
  "zh": "Moonshots（Peter Diamandis）",
  "host": "Peter H. Diamandis",
  "en": "XPRIZE founder Peter Diamandis and guests track exponential technologies and frontier AI developments.",
  "cn": "XPRIZE 创始人 Peter Diamandis 与嘉宾追踪指数级技术与前沿 AI 进展。"
 },
 "Evan Carmichael": {
  "zh": "Evan Carmichael",
  "host": "Evan Carmichael",
  "en": "Entrepreneurship channel by Evan Carmichael, covering how founders and creators put AI to work.",
  "cn": "Evan Carmichael 的创业频道，讲创始人与创作者如何把 AI 用起来。"
 },
 "Stripe Sessions": {
  "zh": "Stripe Sessions",
  "host": "Stripe",
  "en": "Stripe's annual conference; its fireside chats pair Stripe's leaders with founders and executives.",
  "cn": "Stripe 的年度大会，炉边对话由 Stripe 高管与创始人、企业高管同台。"
 },
 "Databricks Fireside": {
  "zh": "Databricks 炉边对话",
  "host": "Databricks",
  "en": "Fireside conversations hosted by Databricks between its leadership and partners across the AI industry.",
  "cn": "Databricks 主办的炉边对谈，由其管理层与 AI 产业伙伴对话。"
 },
 "LangChain Interrupt": {
  "zh": "LangChain Interrupt",
  "host": "LangChain",
  "en": "Interrupt is LangChain's conference on AI agents; sessions feature researchers and builders in the agent ecosystem.",
  "cn": "Interrupt 是 LangChain 的 AI agent 大会，议程邀请 agent 生态的研究者与建造者。"
 },
 "Acquired Unplugged (presented by WorkOS)": {
  "zh": "Acquired Unplugged（WorkOS 呈现）",
  "host": "Ben Gilbert & David Rosenthal",
  "en": "An intimate live founder event presented by WorkOS, hosted on stage by the Acquired podcast's Ben Gilbert and David Rosenthal.",
  "cn": "由 WorkOS 呈现的小型创始人现场活动，由 Acquired 播客主持人 Ben Gilbert 与 David Rosenthal 登台主持。"
 },
 "Laude Institute": {
  "zh": "Laude Institute",
  "host": "Laude Institute",
  "en": "Laude Institute's channel — in-depth conversations with the researchers and founders behind frontier AI.",
  "cn": "Laude Institute 频道，与前沿 AI 背后的研究者和创始人深度对谈。"
 },
 "SingularityNET (AGI-25 Conference)": {
  "zh": "SingularityNET（AGI-25 大会）",
  "host": "SingularityNET",
  "en": "Keynotes from the Annual AGI Conference, the long-running academic meeting on artificial general intelligence.",
  "cn": "年度 AGI 大会的主题演讲，该会议是通用人工智能领域长期举办的学术会议。"
 },
 "WCIT": {
  "zh": "WCIT 年度讲座",
  "host": "Worshipful Company of Information Technologists",
  "en": "The Worshipful Company of Information Technologists' annual lecture, a London livery company event on computing.",
  "cn": "英国资讯科技业公会的年度讲座，伦敦同业公会举办的计算主题活动。"
 },
 "Future London Academy": {
  "zh": "Future London Academy",
  "host": "Future London Academy",
  "en": "A London design-education programme; its talks bring in design leaders from major technology companies.",
  "cn": "伦敦的设计教育机构，其讲座邀请大型科技公司的设计负责人分享。"
 },
 "Nexus Luxembourg": {
  "zh": "Nexus Luxembourg",
  "host": "Nexus Luxembourg",
  "en": "Luxembourg's innovation conference; its fireside chats bring together technology founders and policymakers.",
  "cn": "卢森堡的创新大会，炉边对话让科技创始人与政策制定者同台。"
 },
 "AI Inside": {
  "zh": "AI Inside",
  "host": "AI Inside",
  "en": "An interview show on where AI is actually heading, talking with researchers and industry figures.",
  "cn": "一档访谈节目，与研究者和业内人士探讨 AI 的真实走向。"
 },
 "Agents of Tech": {
  "zh": "Agents of Tech",
  "host": "Agents of Tech",
  "en": "Technology interviews recorded on location at scientific and industry conferences.",
  "cn": "在科学与产业会议现场录制的科技访谈。"
 },
 "Offcall": {
  "zh": "Offcall",
  "host": "Offcall",
  "en": "Offcall's How I Doctor series on medicine and technology, hosted by physician Dr. Graham Walker.",
  "cn": "Offcall 的 How I Doctor 系列，由医生 Graham Walker 主持，聊医学与技术。"
 },
 "The Peterman Pod": {
  "zh": "The Peterman Pod",
  "host": "Ryan Peterman",
  "en": "Software engineer Ryan Peterman interviews engineering leaders about careers and how teams are built.",
  "cn": "软件工程师 Ryan Peterman 对话工程管理者，聊职业发展与团队搭建。"
 },
 "The AmberMac Show": {
  "zh": "The AmberMac Show",
  "host": "Amber Mac",
  "en": "Amber Mac's SiriusXM podcast on technology and its social impact; episodes include recorded fireside chats.",
  "cn": "Amber Mac 在 SiriusXM 的播客，关注技术及其社会影响，含现场炉边对谈录制。"
 },
 "Lisa Burke": {
  "zh": "Lisa Burke",
  "host": "Lisa Burke",
  "en": "Broadcaster Lisa Burke's interview channel, with a focus on European science, technology and policy.",
  "cn": "主持人 Lisa Burke 的访谈频道，关注欧洲的科学、技术与政策。"
 },
 "Jon Hernandez AI (Inteligencia Artificial con Jon Hernandez)": {
  "zh": "Jon Hernandez AI",
  "host": "Jon Hernandez",
  "en": "Spanish AI communicator Jon Hernandez's podcast; guest interviews are conducted in English.",
  "cn": "西班牙 AI 传播者 Jon Hernandez 的播客，嘉宾访谈以英文进行。"
 },
 "Tesla Q2 2026 Earnings Call": {
  "zh": "特斯拉 2026 Q2 财报电话会",
  "host": "Tesla",
  "en": "Tesla's Q2 2026 financial results and Q&A webcast, published on Tesla's own channel.",
  "cn": "特斯拉 2026 年第二季度财报与问答电话会，由特斯拉官方频道发布。"
 },
 "Alphabet Q2 2026 Earnings Call": {
  "zh": "Alphabet 2026 Q2 财报电话会",
  "host": "Alphabet Investor Relations",
  "en": "Alphabet's Q2 2026 earnings call, published by Alphabet Investor Relations.",
  "cn": "Alphabet 2026 年第二季度财报电话会，由 Alphabet 投资者关系部门发布。"
 },
 "Apple Q3 2026 Earnings Call": {
  "zh": "苹果 2026 Q3 财报电话会",
  "host": "Apple",
  "en": "Apple's Q3 FY2026 earnings call with management remarks and analyst Q&A.",
  "cn": "苹果 2026 财年第三季度财报电话会，含管理层陈述与分析师问答。"
 },
 "SpaceX Q2 2026 Earnings Call": {
  "zh": "SpaceX 2026 Q2 财报电话会",
  "host": "SpaceX",
  "en": "SpaceX's Q2 FY2026 earnings call; this recording was carried live by financial media outlet Benzinga.",
  "cn": "SpaceX 2026 财年第二季度财报电话会，本段录音由财经媒体 Benzinga 直播转播。"
 },
 "SpaceX All-Hands": {
  "zh": "SpaceX 全员大会",
  "host": "SpaceX",
  "en": "Remarks from a SpaceX company all-hands; this recording circulated via a third-party channel, not SpaceX's own.",
  "cn": "SpaceX 全员大会上的讲话；本段录音经第三方频道流传，非 SpaceX 官方发布。"
 },
 "My First Million": {
  "zh": "My First Million",
  "host": "Sam Parr & Shaan Puri",
  "en": "Sam Parr and Shaan Puri break down business ideas and interview founders about how they built and sold companies.",
  "cn": "Sam Parr 与 Shaan Puri 拆解商业点子，并访谈创始人如何做成与卖掉公司。"
 },
 "Asian American Scholar Forum": {
  "zh": "亚裔美国学者论坛",
  "host": "亚裔美国学者论坛",
  "en": "A forum featuring talks by Asian American scholars on AI, science, and innovation.",
  "cn": "亚裔美国学者论坛，探讨AI、科学与创新。"
 },
 "NVIDIA Q2 FY2027 Earnings Call": {
  "zh": "英伟达 2027 财年 Q2 财报电话会",
  "host": "NVIDIA Investor Relations",
  "en": "NVIDIA's Q2 FY2027 earnings call: CFO commentary, Jensen Huang's remarks and analyst Q&A.",
  "cn": "英伟达 2027 财年第二季度财报电话会，含 CFO 财务陈述、黄仁勋发言与分析师问答。"
 }
};
const slugify=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
// 有 189 个节目有集数,但只有 150 个写了 POD_INFO。以前 POD_SLUG 只从 POD_INFO 建,
// 剩下 39 个节目点封面会解析不到 key、vPod 直接 return vHome() —— 表现为"点了没反应弹回首页"。
const POD_SLUG={};
Object.keys(POD_INFO).forEach(k=>POD_SLUG[slugify(k)]=k);
EPISODES.forEach(e=>{const k=e.pod.en;if(k&&!POD_SLUG[slugify(k)])POD_SLUG[slugify(k)]=k;});
function goPod(en){if(window.event)window.event.stopPropagation();go('#/pod/'+slugify(en));}
/* 观点演变(按 pid;由 pipeline/gen_views.py 基于各期核心观点/反共识+日期生成) */
/*VIEWS_START*/const VIEWS={};/*VIEWS_END*/
/*TOPICS_START*/const TOPICS={"defs": [{"slug": "self-improvement", "zh": "递归自我改进与超级智能", "en": "Self-improvement & superintelligence"}, {"slug": "agi-timeline", "zh": "AGI 时间表", "en": "Timeline to AGI"}, {"slug": "scaling", "zh": "规模化与瓶颈", "en": "Scaling & its limits"}, {"slug": "rl", "zh": "强化学习的角色", "en": "The role of RL"}, {"slug": "alignment", "zh": "对齐与安全", "en": "Alignment & safety"}, {"slug": "open-closed", "zh": "开源 vs 闭源", "en": "Open vs closed"}, {"slug": "agents", "zh": "智能体", "en": "Agents"}, {"slug": "economy-jobs", "zh": "就业与经济", "en": "Jobs & the economy"}, {"slug": "architecture", "zh": "架构与下一突破", "en": "Architectures & next breakthroughs"}], "counts": {"self-improvement": [98, 58], "agi-timeline": [128, 68], "scaling": [286, 127], "rl": [132, 65], "alignment": [275, 123], "open-closed": [200, 94], "agents": [320, 143], "economy-jobs": [316, 140], "architecture": [448, 177]}, "items": null};const TOPIC_REL={"jeffdean-asianame-2026":["sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026","awang-ycombina-2026"],"sutton-training-2026":["jeffdean-asianame-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026","awang-ycombina-2026"],"alexkrentsel-latentsp-2026":["jeffdean-asianame-2026","sutton-training-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026","awang-ycombina-2026"],"brettadcock-myfirstm-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026","awang-ycombina-2026"],"linqiao-training-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026","awang-ycombina-2026"],"ryangreenblatt-dwarkesh-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","elon-spacexal-2026","danshipper-jonnymil-2026","awang-ycombina-2026"],"elon-spacexal-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","danshipper-jonnymil-2026","awang-ycombina-2026"],"danshipper-jonnymil-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","awang-ycombina-2026"],"awang-ycombina-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"tworek-training-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"logankilpatrick-1st10pod-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"boris-ycombina-2026b":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"hasani-moonshot-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"schmidhuber-alexkant-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"adambrown-dwarkesh-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"mosseri-lennyspo-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"schmidhuber-unsuperv-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"hasani-thecogni-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"catanzaro-themadpo-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"hinton-mitimes-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"noambrown-nopriors-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"deanball-thecogni-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"dario-bloomber-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"ethanmollick-simonsin-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"tejal-theopena-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"arimorcos-unsuperv-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"noambrown-baincapi-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"carinahong-latentsp-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"alibehrouz-thecogni-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"ethanhe-latentsp-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"altman-cnn-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"awang-corememo":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"angelajiang-aii-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"bethbarnes-machinel-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"demis-ycombina-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"fedus-nopriors-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"edwinchen-stanford-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"felixrieseberg-latentsp-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"kohli-googlede-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"markchen-institut-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"nando-iafrikan-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"hinton-startalk":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"naval-naval-2026c":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"awang-aninewsi-2026":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"shanelegg-googlede-2025":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"dsilver-publicle-2025":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"jasonwei-stanford-2025":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"karpathy-dwarkesh":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"sholto-themadpo":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"aravind-siliconv-2025":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"nanda-80000hou-2025":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"hendrycks-machinel-2025":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"altman-hugeiftr":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"dario-cheekypi":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"pachocki-beforeag-2025":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"jumper-agentsof-2025":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"laskin-themadpo-2025":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"altman-theopena-2025":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"thomaswolf-training-2025":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"zuckerberg-thispast-2025":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"antonoglou-training-2025":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"schmidhuber-machinel-2025":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"oriol-googlede-2024":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"malik-therobot-2023":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"ilya-dwarkesh-2023":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"karpathy-lexfridm":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"abbeel-thetwiml-2021":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"pathak-cmurobot-2020":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"brockman-ycombina-2017":["jeffdean-asianame-2026","sutton-training-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026","linqiao-training-2026","ryangreenblatt-dwarkesh-2026","elon-spacexal-2026","danshipper-jonnymil-2026"],"jensen-nvidiaq2-2026":["altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026","awang-ycombina-2026"],"altman-davidsen-2026":["jensen-nvidiaq2-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026","awang-ycombina-2026"],"danbalsam-thecogni-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026","awang-ycombina-2026"],"kokotajlo-lawfare-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026","awang-ycombina-2026"],"garrytan-ycombina-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026","awang-ycombina-2026"],"zvi-thecogni-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","igorbabuschkin-unsuperv-2026","awang-ycombina-2026"],"igorbabuschkin-unsuperv-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","awang-ycombina-2026"],"elon-theecono-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"akshaynathan-latentsp-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"altman-investli-2026":["jensen-nvidiaq2-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026","awang-ycombina-2026"],"scottwu-sourcery-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"sundarpichai-alphabet-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"derya-foundmyf-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"linqiao-20vcwith-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"demis-wcit-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"kokotajlo-thediary-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026","awang-ycombina-2026"],"dylanpatel-sequoiac-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"ajambrosino-lennyspo-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"markchen-latentsp-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"bengio-sineadbo-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"benedictevans-analysep-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"demis-semafort-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"joonpark-googlede-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"logankilpatrick-training-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"lecun-computer-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"suleyman-decoder":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"awang-bloomber-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"alexwei-theopena-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"hinton-alexkant-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"mensch-cnbc-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"oriol-unsuperv-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"mjordan-machinel-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"noambrown-arcprize-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"garrytan-tetragra-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026","awang-ycombina-2026"],"bengio-jonherna-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"brettadcock-sourcery-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026","awang-ycombina-2026"],"brockman-sequoiac-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"pathak-nvidia-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"brockman-bigtechn":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"jensen-lexfridm-2026":["altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026","awang-ycombina-2026"],"andrewng-thisisth-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"dario-peopleby-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"lecun-aninews-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"dario-dwarkesh":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"suleyman-financia-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"jimfan-radicalv-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"sholto-tbpn-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"andreessen-lennyspo-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"tworek-unsuperv-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"andrewng-theecono-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"mensch-bigtechn":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"springenberg-training-2026":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"edwinchen-lennyspo-2025":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"jensen-thejoero-2025":["altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026","awang-ycombina-2026"],"diannepenn-unsuperv-2025":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"delangue-relentle-2025":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"ilya-dwarkesh-2025":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"feifei-bloomber-2025":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"lambert-themadpo-2025":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"feifei-lennyspo":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"sutton-dwarkesh":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"markchen-corememo-2025":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"benmann-lennyspo-2025":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"danshipper-lennyspo-2025":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"mikekrieger-lennyspo-2025":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"parada-googlede-2025":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"sholto-unsuperv-2025":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"jaderberg-training-2025":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"shazeer-unsuperv-2025":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"kolter-20vc":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"zuckerberg-dwarkesh-2024":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"leike-80000hou":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"murati-microsof":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"naval-thejoero-2019":["jensen-nvidiaq2-2026","altman-davidsen-2026","brettadcock-myfirstm-2026","danbalsam-thecogni-2026","kokotajlo-lawfare-2026","garrytan-ycombina-2026","zvi-thecogni-2026","igorbabuschkin-unsuperv-2026"],"tworek-mts-2026":["jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026","finn-ycombina-2026"],"dylanpatel-dwarkesh-2026b":["tworek-mts-2026","jensen-nvidiaq2-2026","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026","finn-ycombina-2026"],"michaelkratsios-ycombina-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","brettadcock-myfirstm-2026","finn-ycombina-2026"],"finn-ycombina-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"brendanfoody-training-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"mattmcpartland-latentsp-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"matthieuwyart-machinel-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"flocrivello-thecogni-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"alexatallah-20vc-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"feifei-huberman-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"joshmeier-training-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"dmitridolgov-ycombina-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"joonpark-20vc-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"jeffdean-ycombina-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026","finn-ycombina-2026"],"andrewng-washingt-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"damianborth-thetwiml-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"diannepenn-lennyspo-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"andyfang-nopriors-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"feldman-themadpo-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"eisokant-latentsp-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"bowang-latentsp-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"qasaryounis-thea16zp-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"boris-bloomber-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"andybeam-latentsp-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"benedictevans-unsuperv-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"sachinkatti-themadpo-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"danklein-theaiwhy-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"danbiderman-latentsp-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"wiltschko-thetwiml-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"akshatbubna-latentsp-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"kellerrinaudocliffto-training-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"derya-theopena-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"ilya-visionec-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"naval-naval-2026b":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"brockman-alexkant-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"edunov-latentsp-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"grantsanderson-dwarkesh-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"zuckerberg-complex-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"danklein-gradient-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"aravind-20vcwith-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"mattwhite-finovers-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"zuckerberg-nopriors-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"dario-thecircu-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"satya-reidhoff-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"satya-nopriors-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"murati-bloomber":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"kaiser-unsuperv-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"boris-acquired-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"demis-unsuperv-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"waldenyan-latentsp-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"rodriques-gradient-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"alexrives-latentsp-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"lambert-aiproem-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"ericjang-dwarkesh-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"lecun-unsuperv":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"kolter-themadpo":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"reinerpope-dwarkesh-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"shawnwang-unsuperv-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"mensch-lisaburk-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"kendall-gradient-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"slevine-aiagentf-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"ermon-thetwiml-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"hinton-theamber-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"hausman-thegener-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"sutton-stanford-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026","finn-ycombina-2026"],"turley-bg2pod-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"dario-databric-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"raschka-thetwiml-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"ajambrosino-aii-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"bengio-siliconv-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"lecun-offcall-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"carinahong-gradient-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"yejin-thetwiml-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"fadell-newcomer-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"hafner-buzzrobo-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"chowdhery-thetwiml-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"feifei-thetimfe-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"jumper-googlede-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"justinjohnson-latentsp-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"llion-machinel-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"billpeebles-unsuperv-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"brettaylor-thelogan-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"tombrown-ycombina-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"erikschluntz-anthropi-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"brettaylor-lennyspo-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"kaplan-ycombina-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"finn-ycombina-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"lample-latentsp-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"bricken-dwarkesh-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"truell-lennyspo-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"zuckerberg-dwarkesh-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"karina-lennyspo-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"christiano-80000hou-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"truell-lexfridm-2024":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"tridao-unsuperv-2024":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"karpathy-nopriors":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"schulman-therobot-2023":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"bengio-lexfridm-2018":["tworek-mts-2026","jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","brettadcock-myfirstm-2026"],"fatihporikli-thetwiml-2026":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026","tworek-training-2026"],"thomaswolf-themadpo-2026":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","igorbabuschkin-unsuperv-2026","tworek-training-2026"],"feifei-thea16zp-2026":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"pullen-machinel-2026":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"davidad-thecogni-2026":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"matei-latentsp-2026":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"demis-stanford-2026":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"bengio-80000hou":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"brockman-bigtechn-2026":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"altman-corememo-2026":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"pachocki-unsuperv-2026":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"jeffdean-nvidia-2026":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"demis-hugeiftr":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"lecun-thisisth":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"brockman-tetragra-2026":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"jeffdean-princeto-2026":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"lambert-turingpo-2026":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"lambert-lexfridm-2026":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"sutton-acmbytec-2026":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"edwinchen-unsuperv-2025":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"yejin-laudeins-2025":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"kaiser-themadpo":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"deviparikh-thetwiml-2025":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"fulford-nopriors-2025":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"shazeer-dwarkesh-2025":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"dario-lexfridm":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"lecun-lexfridm":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"demis-dwarkesh-2024":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"jimfan-outsetca-2023":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"altman-lexfridm-2023":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"bengio-machinel":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"andrewng-lexfridm-2020":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"brockman-lexfridm-2019":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"leike-80000hou-2018":["tworek-mts-2026","brettadcock-myfirstm-2026","finn-ycombina-2026","linqiao-training-2026","brendanfoody-training-2026","fatihporikli-thetwiml-2026","thomaswolf-themadpo-2026","igorbabuschkin-unsuperv-2026"],"animaanandkumar-latentsp-2026":["tworek-mts-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026","linqiao-training-2026"],"dylanpatel-semianal-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","altman-davidsen-2026","michaelkratsios-ycombina-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026","linqiao-training-2026","brendanfoody-training-2026"],"tommcgrath-southpar-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","linqiao-training-2026"],"karina-mts-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"adamgleave-thecogni-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"andrewng-berggrue-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"feldman-sourcery-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"perszyk-latentsp-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"neelnanda-googlede-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"andreessen-thea16zp-2026b":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"dylanfield-sourcery-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"thomasahle-machinel-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"mikekrieger-alexkant-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"kolter-latentsp-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"mikekrieger-aii-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"jensen-training":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"fadell-lennyspo-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"rohinshah-80000hou-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"danshipper-lennyspo-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"feldman-parzival-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"caitlin-lennyspo-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"karpathy-training":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"naval-naval-2026d":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"aravind-thisweek-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"jensen-dwarkesh":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"evanspiegel-thefutur-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"simonwillison-lennyspo-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"jensen-allinpod-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"garrytan-sxsw-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"qasaryounis-lennyspo-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"jhoward-machinel-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"steinberger-lexfridm-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"davidsp-anthropi-2025":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"askell-anthropi-2025":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"emilycampbell-diveclub-2025":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"carlpei-accesspo-2025":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"tworek-themadpo-2025":["animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026","linqiao-training-2026"],"turley-lennyspo-2025":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"lambert-intercon":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"karpathy-ycombina-2025":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"batson-stanford-2025":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"sholto-dwarkesh-2025":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"lambert-thecogni":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"sutton-thetraje":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"leike-thecogni":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"sholto-dwarkesh":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"mensch-nopriors":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"percyliang-imbue-2023":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"olah-80000hou-2023":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"bubeck-sparksof-2023":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"shazeer-aarthian-2023":["tworek-mts-2026","animaanandkumar-latentsp-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","alexkrentsel-latentsp-2026","tommcgrath-southpar-2026"],"paragagrawal-training-2026":["jensen-nvidiaq2-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026","finn-ycombina-2026"],"gabepereyra-sequoiac-2026":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"steinberger-ycombina-2026":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"arvindjain-composio-2026":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"melisatokmak-nopriors-2026":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"matangrinberg-sequoiac-2026":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"katelynlesse-sequoiac-2026":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"arvindjain-20vcwith-2026":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"aravind-powerful-2026":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"brettaylor-clickhou-2026":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"steinberger-ainewspo-2026":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"jensen-associat-2026":["paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026","finn-ycombina-2026"],"gustav-founders-2026":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"benedictevans-lennyspo-2026":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"altman-stripese-2026":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"brettadcock-overtheh-2026":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","tommcgrath-southpar-2026","finn-ycombina-2026"],"naval-naval-2026e":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"philipkiely-thetwiml-2026":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"clairevo-lennyspo-2026":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"karpathy-noprior-2026":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"sherwinwu-lennyspo-2026":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"carlpei-thegener-2026":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"suleyman-bloomber":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"carlpei-thegstaa-2025":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"varun-20vc-2025":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"scottwu-lennyspo-2025":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"elon-thejoero-2025":["jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","jeffdean-asianame-2026","michaelkratsios-ycombina-2026","dylanpatel-semianal-2026","brettadcock-myfirstm-2026","tommcgrath-southpar-2026"],"dhh-lexfridm-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026","traviskalanick-davidsen-2026"],"johnbai-diveclub-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026","traviskalanick-davidsen-2026"],"joonpark-latentsp-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026","traviskalanick-davidsen-2026"],"patrickmorgan-diveclub-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","dylanpatel-semianal-2026","traviskalanick-davidsen-2026"],"traviskalanick-davidsen-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"harrisonchase-training-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"garrytan-thea16zp-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"kylezantos-diveclub-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"lipbutan-techsurg-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"gabepereyra-training-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"stephenhaney-ycombina-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"altman-relentle-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"pablostanley-diveclub-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"thariq-peteryan-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"chrispedregal-aii-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"meaghanchoi-diveclub-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"lamismukta-ainative-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"pincus-jamesalt-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"andrewng-langchai-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"benedictevans-thea16zp-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"feldman-bloomber-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"felixrieseberg-howiai-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"jureleskovec-thetwiml-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"feldman-nopriors-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"tommygeoco-diveclub-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"katarinabatina-diveclub-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"brianlovin-diveclub-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"marvinschwaibold-diveclub-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"floraguo-diveclub-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"krispuckett-diveclub-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"carlpei-sxsw-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"lipbutan-stanford-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"robertlange-machinel-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"luisouriach-diveclub-2026":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"suleyman-moonshot-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"godement-unsuperv-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"steveruiz-diveclub-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"geoffreylitt-diveclub-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"sutton-singular-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"eschavera-diveclub-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"scottwu-cheekypi-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"jackph-thetwiml-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"vitalyfriedman-diveclub-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"pietroschirano-diveclub-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"ryolu-diveclub-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"noambrown-latentsp-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"lipbutan-cadence-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"ammaarreshi-diveclub-2025":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"lambert-superdat":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"zuckerberg-lexfridm-2023":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"nando-therobot-2023":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"noambrown-nopriors-2023":["tworek-mts-2026","jensen-nvidiaq2-2026","dhh-lexfridm-2026","johnbai-diveclub-2026","paragagrawal-training-2026","joonpark-latentsp-2026","patrickmorgan-diveclub-2026","dylanpatel-semianal-2026"],"iansilber-lennyspo-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","traviskalanick-thea16zp-2026b"],"traviskalanick-thea16zp-2026b":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"pincus-motleyfo-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"maxhodak-ycombina-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"collison-ycombina-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"traviskalanick-thea16zp-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"thariq-southpar-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"noamsegal-lennyspo-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"andreessen-newyorkp-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"boris-claude-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"danbiderman-training-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"jumper-machinel-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"fiona-lennyspo-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"feifei-siliconv-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"fadell-giantide-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"rasmusandersson-southpar-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"catwu-lennyspo":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"gomez-upstarts-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"dylanfield-peteryan-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"bengio-radiodav-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"jennywen-lennyspo-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"rudin-thetwiml-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"nadchishtie-diveclub-2025b":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"dylanfield-lennyspo-2025":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"berntbornich-relentle-2025":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"carlrivera-diveclub-2025":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"joellewenstein-diveclub-2024":["tworek-mts-2026","animaanandkumar-latentsp-2026","jensen-nvidiaq2-2026","paragagrawal-training-2026","dylanpatel-dwarkesh-2026b","altman-davidsen-2026","joonpark-latentsp-2026","iansilber-lennyspo-2026"],"maxhodak-nopriors-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","traviskalanick-davidsen-2026","alexkrentsel-latentsp-2026","brettadcock-myfirstm-2026"],"elon-spacexq2-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","maxhodak-nopriors-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","traviskalanick-davidsen-2026","alexkrentsel-latentsp-2026"],"philipkiely-latentsp-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","maxhodak-nopriors-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","traviskalanick-davidsen-2026","alexkrentsel-latentsp-2026"],"jensen-ycombina-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","maxhodak-nopriors-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","traviskalanick-davidsen-2026","alexkrentsel-latentsp-2026"],"elon-seancste-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","maxhodak-nopriors-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","traviskalanick-davidsen-2026","alexkrentsel-latentsp-2026"],"qasaryounis-lemonade-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","maxhodak-nopriors-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","traviskalanick-davidsen-2026","alexkrentsel-latentsp-2026"],"boris-scale-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","maxhodak-nopriors-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","traviskalanick-davidsen-2026","alexkrentsel-latentsp-2026"],"reinerpope-dwarkesh-2026b":["tworek-mts-2026","animaanandkumar-latentsp-2026","maxhodak-nopriors-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","traviskalanick-davidsen-2026","alexkrentsel-latentsp-2026"],"altman-nothingb-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","maxhodak-nopriors-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","traviskalanick-davidsen-2026","alexkrentsel-latentsp-2026"],"brandonjacoby-diveclub-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","maxhodak-nopriors-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","traviskalanick-davidsen-2026","alexkrentsel-latentsp-2026"],"iansilber-diveclub-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","maxhodak-nopriors-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","traviskalanick-davidsen-2026","alexkrentsel-latentsp-2026"],"mikekrieger-aii-2026b":["tworek-mts-2026","animaanandkumar-latentsp-2026","maxhodak-nopriors-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","traviskalanick-davidsen-2026","alexkrentsel-latentsp-2026"],"bengio-centerfo-2026":["tworek-mts-2026","animaanandkumar-latentsp-2026","maxhodak-nopriors-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","traviskalanick-davidsen-2026","alexkrentsel-latentsp-2026"],"roozmahdavian-diveclub-2025":["tworek-mts-2026","animaanandkumar-latentsp-2026","maxhodak-nopriors-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","traviskalanick-davidsen-2026","alexkrentsel-latentsp-2026"],"noambrown-sequoiac-2025":["tworek-mts-2026","animaanandkumar-latentsp-2026","maxhodak-nopriors-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","traviskalanick-davidsen-2026","alexkrentsel-latentsp-2026"],"gunnargray-diveclub-2025":["tworek-mts-2026","animaanandkumar-latentsp-2026","maxhodak-nopriors-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","traviskalanick-davidsen-2026","alexkrentsel-latentsp-2026"],"awang-shawnrya-2025":["tworek-mts-2026","animaanandkumar-latentsp-2026","maxhodak-nopriors-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","traviskalanick-davidsen-2026","alexkrentsel-latentsp-2026"],"shanahan-googlede-2025":["tworek-mts-2026","animaanandkumar-latentsp-2026","maxhodak-nopriors-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","traviskalanick-davidsen-2026","alexkrentsel-latentsp-2026"],"tuhinkumar-diveclub-2025":["tworek-mts-2026","animaanandkumar-latentsp-2026","maxhodak-nopriors-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","traviskalanick-davidsen-2026","alexkrentsel-latentsp-2026"],"nadchishtie-diveclub-2025":["tworek-mts-2026","animaanandkumar-latentsp-2026","maxhodak-nopriors-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","traviskalanick-davidsen-2026","alexkrentsel-latentsp-2026"],"suleyman-intellig":["tworek-mts-2026","animaanandkumar-latentsp-2026","maxhodak-nopriors-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","traviskalanick-davidsen-2026","alexkrentsel-latentsp-2026"],"gustav-lennyspo-2023":["tworek-mts-2026","animaanandkumar-latentsp-2026","maxhodak-nopriors-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","traviskalanick-davidsen-2026","alexkrentsel-latentsp-2026"],"albertgu-stanford-2022":["tworek-mts-2026","animaanandkumar-latentsp-2026","maxhodak-nopriors-2026","jeffdean-asianame-2026","sutton-training-2026","michaelkratsios-ycombina-2026","traviskalanick-davidsen-2026","alexkrentsel-latentsp-2026"]};/*TOPICS_END*/

/* ============================ HELPERS ============================ */
/* ⚠️ $ 与下面这些 helper 必须留在 TOPICS 标记对之外:split_data.py 每次整段重写那对标记
   之间的内容,落进去就会被吞掉。2026-08-19 线上首页卡 loading 的根因就是这个 ——
   merge 后多出一个野的起始标记,把 const $ 那行连同注释一起吃了,54 处 $() 全部 ReferenceError,
   而语法检查是过的(运行时错误,不是解析错误),所以门禁没拦住。 */
const $=s=>document.querySelector(s);
const epsOf=pid=>EPISODES.filter(e=>e.pid===pid);
/* 未登记的领域 key 一律跳过/灰色兜底，避免脏数据把整页渲染搞挂（auto_refresh 无人值守，必须容错） */
const fcolor=f=>(FIELDS[f]||{}).c||'#9aa4b2';
const fdot=f=>FIELDS[f]?`<span class="fdot" style="background:${FIELDS[f].c}"></span>`:'';
const tag=f=>FIELDS[f]?`<span class="tag">${fdot(f)}${FIELDS[f].zh}</span>`:'';
const fmtDate=d=>{const[y,m,dd]=(d||'').split('-');return dd?`${y}.${m}.${dd}`:`${y}.${m}`};
const fmtDur=m=>m>=60?`${Math.floor(m/60)}h${String(m%60).padStart(2,'0')}m`:`${m}m`;
function av(pid,cls=''){const p=PEOPLE[pid];const cs=(p.fields.length?p.fields:['deep-learning']).map(fcolor);
  const bg=cs.length>1?`linear-gradient(135deg,${cs[0]},${cs[1]})`:`linear-gradient(135deg,${cs[0]},${cs[0]})`;
  const img=PHOTOS.has(pid)?`<img src="assets/people/${pid}.webp" alt="${p.en}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='assets/people/${pid}.jpg'">`:'';
  return `<div class="av ${cls}" style="background:${bg}">${p.init}${img}</div>`;}
function epCover(e){const p=PEOPLE[e.pid];const bg=coverBg(p.fields);
  return `<div class="ep-cover" style="background:${bg}">
    <div class="pod" onclick="goPod('${e.pod.en}')" style="cursor:pointer">${podLogo(e)}${e.pod.en}</div>${av(e.pid)}
    <div class="ct"><b>${p.en}</b><span>${fmtDate(e.date)} · ${fmtDur(e.min)}</span></div></div>`;}
function epCard(e){
  const rp=!readHas(e.id)&&readPosGet()[e.id];
  const prog=(rp&&rp.s>0&&rp.n)?`<span class="prog-badge">读到 ${Math.min(rp.s+1,rp.n)}/${rp.n} 章</span>`:'';
  return `<div class="ep-card${readHas(e.id)?' read':''}" data-id="${e.id}" onclick="go('#/episode/${e.id}')">
  ${epCover(e)}<span class="cover-badges">${(()=>{   // 单徽标:已读 > 读到N章 > 待读 > NEW,不叠加
    if(readHas(e.id))return '<span class="read-badge" style="display:inline-flex">✓ 已读</span>';
    if(prog)return prog;
    if(laterHas(e.id))return '<span class="later-badge" style="display:inline-flex">★ 待读</span>';
    if(isNew(e))return '<span class="new-badge">NEW</span>';
    return '';})()}</span>
  <div class="ep-meta"><div class="t">${e.tEn}</div><div class="tz">${e.tZh}</div>
  <div class="row">${e.fields.map(tag).join('')}</div></div></div>`;}

/* ============================ VIEWS ============================ */
/* 观点演变(VIEWS)与议题条目(TOPICS.items)按需加载:数据由 pipeline/split_data.py 抽到
   data/views.json、data/topics.json,首屏不再背这 ~250KB(gzip)。
   若某台机器跑了 gen_views/gen_topics 但没跑 split_data,数据仍内联,下面判空后直接跳过拉取,行为不变。 */
const _lazyOn={};
function lazyData(key,url,apply){
  if(_lazyOn[key])return;_lazyOn[key]=1;
  fetch(url).then(r=>r.ok?r.json():Promise.reject(r.status)).then(j=>{
    apply(j);
    const y=scrollY;render();scrollTo(0,y);   // 回填后重渲染,保持滚动位置(同 ep-extra 的做法)
  }).catch(()=>{_lazyOn[key]=0;});            // 失败不缓存,留重试机会
}
function ensureViews(){
  if(Object.keys(VIEWS).length)return true;   // 未拆分:数据已在内联块里
  lazyData('views','data/views.json',j=>Object.assign(VIEWS,j));return false;
}
function ensureTopics(){
  if(TOPICS.items)return true;
  lazyData('topics','data/topics.json',j=>{TOPICS.items=j.items||{};});return false;
}
/* 议题卡的「N 位 · M 条」:items 在手就现算,否则用内联的 counts */
function topicStat(slug){
  const it=TOPICS.items&&TOPICS.items[slug];
  if(it)return{p:new Set(it.map(i=>i.pid)).size,n:it.length};
  const c=(TOPICS.counts||{})[slug]||[0,0];return{n:c[0],p:c[1]};
}
function skTopic(){
  return Array.from({length:3},()=>`<div class="tp-person">
    <div class="tp-head"><div class="sk" style="width:34px;height:34px;border-radius:50%"></div>
      <div class="sk" style="width:150px;height:15px;margin-left:10px"></div></div>
    <div class="tp-quotes">${Array.from({length:2},()=>`<div class="sk-card" style="margin-bottom:12px">
      <div class="sk" style="width:92%;height:15px;margin-bottom:9px"></div>
      <div class="sk" style="width:78%;height:14px;opacity:.7"></div></div>`).join('')}</div>
  </div>`).join('');
}

/* 继续阅读（最近打开的单集） */
function recentGet(){try{const r=JSON.parse(localStorage.recentEpisodes||'[]');return Array.isArray(r)?r:[]}catch(e){return[]}}
let _recentSnap=localStorage.recentEpisodes||'';
addEventListener('visibilitychange',()=>{
  if(document.visibilityState!=='visible')return;
  const cur=localStorage.recentEpisodes||'';
  const onHome=!(location.hash||'#/').slice(2).split('?')[0].split('/').filter(Boolean).length;
  if(onHome&&cur!==_recentSnap){const sy=scrollY;render();scrollTo(0,sy);}
  _recentSnap=cur;
});
function recentAdd(id){let r=recentGet().filter(x=>x!==id);r.unshift(id);localStorage.recentEpisodes=JSON.stringify(r.slice(0,12));_recentSnap=localStorage.recentEpisodes;
  try{const t=JSON.parse(localStorage.recentT||'{}');t[id]=Date.now();
    const ks=Object.keys(t);if(ks.length>30){ks.sort((a,b)=>t[a]-t[b]);ks.slice(0,ks.length-30).forEach(k=>delete t[k]);}
    localStorage.recentT=JSON.stringify(t);}catch(_){}
  syncTouch();}
function recentTGet(){try{const r=JSON.parse(localStorage.recentT||'{}');return r&&typeof r==='object'?r:{}}catch(e){return{}}}
/* 已读标记（localStorage）:列表卡片显示徽标，详情页可手动切换，或滚到底自动标记 */

/* 已读长图:把 localStorage.readEpisodes 画成可分享的长图(站名+slogan+统计+清单+二维码) */
async function readShareImage(){
  let ids=[];try{const r=JSON.parse(localStorage.readEpisodes||'[]');if(Array.isArray(r))ids=r;}catch(e){}
  const eps=ids.map(id=>EPISODES.find(e=>e.id===id)).filter(Boolean).reverse();
  if(!eps.length){alert('还没有已读的播客——打开一期读到底会自动标记已读，再来生成吧。');return;}
  const shown=eps.slice(0,40), more=eps.length-shown.length;
  const totalMin=eps.reduce((s,e)=>s+(e.min||0),0), hrs=Math.round(totalMin/6)/10;
  const ppl=new Set(eps.map(e=>e.pid)).size;
  const imgs={};
  await Promise.all([...new Set(shown.map(e=>e.pid))].map(pid=>new Promise(res=>{
    if(typeof PHOTOS==='undefined'||!PHOTOS.has(pid))return res();
    const im=new Image();im.onload=()=>{imgs[pid]=im;res()};im.onerror=()=>res();
    im.src='assets/people/'+pid+'.jpg';})));
  const qr=await new Promise(res=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>res(null);im.src='assets/qr.png';});
  const W=750,pad=44,rowH=94,headH=330,footH=190;
  const H=headH+shown.length*rowH+(more>0?54:12)+footH;
  const cv=document.createElement('canvas');cv.width=W*2;cv.height=H*2;
  const x=cv.getContext('2d');x.scale(2,2);
  const F='-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB",sans-serif';
  x.fillStyle='#0d0d12';x.fillRect(0,0,W,H);
  const dots=['#2997ff','#30d158','#ff9f0a','#bf5af2','#ff375f'];
  dots.forEach((c,i)=>{x.beginPath();x.arc(W-40-i*26,40,5,0,7);x.fillStyle=c;x.fill();});
  x.fillStyle='#fff';x.font='700 30px '+F;x.fillText('AI Podcast · AI 播客',pad,72);
  x.fillStyle='rgba(255,255,255,.55)';x.font='400 15px '+F;
  x.fillText('海外一线最新 AI 人物播客 · 中英对照全文阅读',pad,100);
  x.fillStyle='#2997ff';x.font='700 40px '+F;
  const stat='我读完了 '+eps.length+' 期';x.fillText(stat,pad,164);
  x.fillStyle='rgba(255,255,255,.85)';x.font='400 17px '+F;
  const _stk=(typeof rlogStreak==='function')?rlogStreak():{cur:0};
  x.fillText('累计约 '+hrs+' 小时 · 覆盖 '+ppl+' 位 AI 人物'+(_stk.cur>1?' · 连续 '+_stk.cur+' 天':''),pad,196);
  {const _pc={};eps.forEach(e=>{const k=(e.pod&&e.pod.zh)||'';if(k)_pc[k]=(_pc[k]||0)+1;});
   const _tp=Object.entries(_pc).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,n])=>k+' ×'+n).join(' · ');
   if(_tp){x.fillStyle='rgba(255,255,255,.45)';x.font='400 14px '+F;x.fillText('常听:'+_tp,pad,220);}}
  {const upsAll=[...new Set(eps.map(e=>e.pid))],ups=[...new Set(shown.map(e=>e.pid))];
   const av=44,ov=30,cy=266;let sx=pad;const maxAv=Math.min(10,ups.length);
   const ring=cx=>{x.strokeStyle='#0d0d12';x.lineWidth=3;x.beginPath();x.arc(cx,cy,av/2+1,0,7);x.stroke();x.lineWidth=1;};
   for(let i=0;i<maxAv;i++){const pid=ups[i];
     x.save();x.beginPath();x.arc(sx+av/2,cy,av/2,0,7);x.clip();
     if(imgs[pid])x.drawImage(imgs[pid],sx,cy-av/2,av,av);
     else{x.fillStyle='#26262e';x.fillRect(sx,cy-av/2,av,av);x.fillStyle='rgba(255,255,255,.8)';x.font='600 15px '+F;x.textAlign='center';x.fillText((PEOPLE[pid]&&PEOPLE[pid].init)||'?',sx+av/2,cy+5);x.textAlign='left';}
     x.restore();ring(sx+av/2);sx+=ov;}
   if(upsAll.length>maxAv){x.fillStyle='#26262e';x.beginPath();x.arc(sx+av/2,cy,av/2,0,7);x.fill();
     x.fillStyle='rgba(255,255,255,.85)';x.font='600 13px '+F;x.textAlign='center';x.fillText('+'+(upsAll.length-maxAv),sx+av/2,cy+5);x.textAlign='left';ring(sx+av/2);}}
  x.strokeStyle='rgba(255,255,255,.12)';x.beginPath();x.moveTo(pad,headH-24);x.lineTo(W-pad,headH-24);x.stroke();
  const ell=(t,mw,f)=>{x.font=f;if(x.measureText(t).width<=mw)return t;while(t.length&&x.measureText(t+'…').width>mw)t=t.slice(0,-1);return t+'…';};
  shown.forEach((e,i)=>{
    const y=headH+i*rowH, p=PEOPLE[e.pid]||{};
    const ax=pad,ay=y+8,as=56;
    x.save();x.beginPath();x.arc(ax+as/2,ay+as/2,as/2,0,7);x.clip();
    if(imgs[e.pid])x.drawImage(imgs[e.pid],ax,ay,as,as);
    else{x.fillStyle='#26262e';x.fillRect(ax,ay,as,as);x.fillStyle='rgba(255,255,255,.8)';x.font='600 20px '+F;x.textAlign='center';x.fillText(p.init||'?',ax+as/2,ay+as/2+7);x.textAlign='left';}
    x.restore();
    const tx=pad+as+18,tw=W-pad-(pad+as+18);
    x.fillStyle='#fff';x.font='600 17px '+F;
    x.fillText(ell(e.tZh||e.tEn,tw,'600 17px '+F),tx,y+32);
    x.fillStyle='rgba(255,255,255,.5)';x.font='400 13px '+F;
    x.fillText(ell((p.zh||p.en||'')+' · '+(e.pod&&e.pod.zh||'')+' · '+e.date+(e.min?' · '+e.min+' 分钟':''),tw,'400 13px '+F),tx,y+56);
    if(i<shown.length-1){x.strokeStyle='rgba(255,255,255,.07)';x.beginPath();x.moveTo(tx,y+rowH-8);x.lineTo(W-pad,y+rowH-8);x.stroke();}
  });
  let fy=headH+shown.length*rowH;
  if(more>0){x.fillStyle='rgba(255,255,255,.45)';x.font='400 14px '+F;x.fillText('… 还有 '+more+' 期已读',pad,fy+26);fy+=54;}else fy+=12;
  x.strokeStyle='rgba(255,255,255,.12)';x.beginPath();x.moveTo(pad,fy+8);x.lineTo(W-pad,fy+8);x.stroke();
  if(qr){x.fillStyle='#fff';x.fillRect(W-pad-104,fy+32,104,104);x.drawImage(qr,W-pad-100,fy+36,96,96);}
  x.fillStyle='#fff';x.font='700 19px '+F;x.fillText('aipodcast.jasonlin.tech',pad,fy+66);
  x.fillStyle='rgba(255,255,255,.55)';x.font='400 14px '+F;
  x.fillText('双语全文 · 核心观点 · AI 问答 · 免费阅读',pad,fy+94);
  x.fillText(qr?'长按识别二维码，一起来读':'长按保存图片分享给朋友',pad,fy+120);
  const url=cv.toDataURL('image/jpeg',.92);
  const m=document.createElement('div');m.className='rsi-modal';
  m.innerHTML='<div class="rsi-card">'+
    '<div class="rsi-head"><div><b>我的已读播客</b><span>'+eps.length+' 期 · 约 '+hrs+' 小时</span></div>'+
    '<button class="rsi-x" onclick="this.closest(\'.rsi-modal\').remove()" aria-label="关闭">×</button></div>'+
    '<div class="rsi-body"><img src="'+url+'" alt="已读播客长图"></div>'+
    '<div class="rsi-foot"><span class="rsi-hint">微信长按图片保存 / 转发</span>'+
    '<a class="rsi-pri" download="my-ai-podcast.jpg" href="'+url+'">保存图片</a>'+
    (navigator.share?'<button class="rsi-sec" onclick="rsiShare(this)">分享</button>':'')+'</div></div>';
  m.addEventListener('click',ev=>{if(ev.target===m)m.remove();});
  document.body.appendChild(m);
  if(typeof beacon==='function')try{beacon('share_img',{n:eps.length})}catch(e){}
}
async function rsiShare(btn){
  try{
    const img=btn.closest('.rsi-modal').querySelector('img');
    const blob=await (await fetch(img.src)).blob();
    const file=new File([blob],'my-ai-podcast.jpg',{type:'image/jpeg'});
    if(navigator.canShare&&navigator.canShare({files:[file]}))await navigator.share({files:[file],title:'我的已读 AI 播客'});
    else await navigator.share({title:'我的已读 AI 播客',url:'https://aipodcast.jasonlin.tech'});
  }catch(e){}
}


/* 每日阅读日志:localStorage.readLog = {"YYYY-MM-DD": 分钟数}(标记已读时累加,取消时扣回) */
function rlogGet(){try{const r=JSON.parse(localStorage.readLog||'{}');return r&&typeof r==='object'?r:{}}catch(e){return{}}}
function rlogAdd(min){if(!min)return;const d=new Date(),k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const g=rlogGet();g[k]=Math.max(0,(g[k]||0)+min);if(g[k]===0)delete g[k];localStorage.readLog=JSON.stringify(g);}
function rlogStreak(){const g=rlogGet();let cur=0,max=0;const day=86400000;const today=new Date();today.setHours(0,0,0,0);
  const has=t=>{const d=new Date(t);const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');return g[k]>0;};
  let t=today.getTime();if(!has(t))t-=day;   // 今天还没读,从昨天起算
  while(has(t)){cur++;t-=day;}
  const ks=Object.keys(g).filter(k=>g[k]>0).sort();let run=0,prev=null;
  ks.forEach(k=>{const t2=new Date(k+'T00:00:00').getTime();run=(prev!==null&&t2-prev===day)?run+1:1;prev=t2;if(run>max)max=run;});
  return {cur,max};}
function readStats(){
  let ids=[];try{const r=JSON.parse(localStorage.readEpisodes||'[]');if(Array.isArray(r))ids=r;}catch(e){}
  const eps=ids.map(id=>EPISODES.find(e=>e.id===id)).filter(Boolean);
  const totalMin=eps.reduce((s,e)=>s+(e.min||0),0);
  const pods={};eps.forEach(e=>{const k=(e.pod&&e.pod.zh)||(e.pod&&e.pod.en)||'?';pods[k]=pods[k]||{n:0,en:(e.pod&&e.pod.en)||''};pods[k].n++;});
  return {eps,totalMin,ppl:new Set(eps.map(e=>e.pid)).size,pods,streak:rlogStreak()};
}

/* 「我的」页:划线标记区块(复用 vMarks 逻辑) */
function mineMarksHtml(){
  const hm=hlGet();const eps=Object.keys(hm).filter(id=>hm[id]&&hm[id].length).map(id=>({id,e:EPISODES.find(x=>x.id===id),items:hm[id]})).filter(x=>x.e);
  eps.forEach(x=>x.last=Math.max.apply(null,x.items.map(i=>i.ts||0)));eps.sort((a,b)=>b.last-a.last);
  const total=eps.reduce((n,x)=>n+x.items.length,0);
  const body=total?eps.map(x=>`<div class="mk-ep"><div class="mk-eph" onclick="go('#/episode/${x.id}')"><b>${x.e.tZh}</b><span>${PEOPLE[x.e.pid]?PEOPLE[x.e.pid].zh:''} · ${x.items.length} 条</span></div>${x.items.map((it,idx)=>`<div class="mk-item"><span class="mk-q" onclick="hlJump('${x.id}',${it.sec},${idx})">${(it.text||'').replace(/</g,'&lt;')}</span><button class="mk-del" title="删除这条标记" onclick="hlRemove('${x.id}',${idx})">×</button></div>`).join('')}</div>`).join('')
    :'<div class="st-empty">还没有划线标记。阅读单集时选中文字，点弹出的「标记」即可收藏到这里。</div>';
  return `<div class="st-h2" style="margin-top:52px">我的标记${total?' · '+total:''}</div>`+body;
}
/* 历史阅读记录自动找回(静默):本地 recentT 同步合并;云端(按同步身份 sid)每天最多拉一次 */
function rlogLocalMerge(){
  const g=rlogGet();let add=0;const rt=recentTGet();
  Object.keys(rt).forEach(id=>{
    const e=EPISODES.find(x=>x.id===id);if(!e||!e.min)return;
    const d=new Date(rt[id]);const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    if(!g[k]){g[k]=e.min;add++;}
  });
  if(add)localStorage.readLog=JSON.stringify(g);
  return add;
}
async function rlogAutoPull(){
  if(!_sid)return;
  const today=new Date().toISOString().slice(0,10);
  if(localStorage.rlogPullDay===today)return;
  try{
    const r=await fetch(STATS_URL+'/my?sid='+encodeURIComponent(_sid));
    const days=(await r.json()).days||{};
    const g=rlogGet();let add=0;
    Object.keys(days).forEach(k=>{
      const mins=days[k].map(id=>{const e=EPISODES.find(x=>x.id===id);return e&&e.min||30;}).reduce((a,b)=>a+b,0);
      if(mins>(g[k]||0)){g[k]=mins;add++;}
    });
    localStorage.rlogPullDay=today;
    if(add){localStorage.readLog=JSON.stringify(g);if((location.hash||'').indexOf('/mine')>=0||(location.hash||'').indexOf('/marks')>=0||(location.hash||'').indexOf('/stats')>=0)render();}
  }catch(e){}
}


/* 分享预览卡:模拟长图头部,提高生成/分享转化 */
function sharePromoHtml(st,hrs){
  const ups=[...new Set(st.eps.map(e=>e.pid))];
  const mx=Math.min(7,ups.length);let avs='';
  for(let i=0;i<mx;i++){const pid=ups[i];const p=PEOPLE[pid]||{};
    avs+=(typeof PHOTOS!=='undefined'&&PHOTOS.has(pid))?`<img src="assets/people/${pid}.webp" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='assets/people/${pid}.jpg'">`:`<span>${p.init||'?'}</span>`;}
  if(ups.length>mx)avs+=`<span>+${ups.length-mx}</span>`;
  return `<div class="shp-card">
    <div class="shp-dots"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="shp-t">我读完了 ${st.eps.length} 期 AI 播客</div>
    <div class="shp-s">累计约 ${hrs} 小时 · 覆盖 ${st.ppl} 位 AI 人物${st.streak.cur>1?' · 连续 '+st.streak.cur+' 天':''}</div>
    <div class="shp-avs">${avs}</div>
    <button class="shp-btn" onclick="readShareImage()">生成长图并分享</button>
  </div>`;
}

function vStats(){
  rlogLocalMerge();setTimeout(rlogAutoPull,60);
  const st=readStats();
  if(!st.eps.length)return `<div class="wrap"><section class="reveal" style="min-height:50vh"><div class="eyebrow">My Space · 我的</div><h2 class="title">我的</h2><div class="st-h2">我的数据</div><div class="st-empty">还没有已读的播客——打开一期读到底会自动标记已读，统计从此开始累计。</div>${pushPanelHtml()}${mineMarksHtml()}</section></div>`;
  const hrs=Math.round(st.totalMin/6)/10;
  const g=rlogGet();
  // 热力图:固定 6–10 月窗口(含未来 3 个月的空格),列=周,行=周日..周六
  const day=86400000;const today=new Date();today.setHours(0,0,0,0);
  const RANGE_END=new Date('2026-10-31T00:00:00');   // 显示到 10 月底
  const end=RANGE_END.getTime()+(6-RANGE_END.getDay())*day;   // 含 10 月末的那一周的周六
  const LAUNCH=new Date('2026-06-01T00:00:00');   // 6 月起算
  const launchSun=LAUNCH.getTime()-LAUNCH.getDay()*day;
  const cols=Math.max(1,Math.ceil((end-launchSun+day)/(7*day)));
  let cells='';const colMon=[];
  for(let w=cols-1;w>=0;w--){
    const t0=end-(w*7+6)*day;colMon.push(new Date(t0+3*day).getMonth()+1);   // 用每列周三(中点)判定月份,避免跨月首列标成上月
    for(let r=0;r<7;r++){
    const t=end-(w*7+(6-r))*day;
    const d=new Date(t);const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    if(t>today.getTime()){cells+=`<i data-l="0" title="${k} · 未来" style="opacity:.35"></i>`;continue;}   // 未来日期:浅色空格
    const m=g[k]||0;const l=m<=0?0:m<20?1:m<45?2:m<90?3:4;
    cells+=`<i data-l="${l}" title="${k} · ${m} 分钟"></i>`;}}
  let mons='';for(let i=0;i<colMon.length;i++){const show=i===0?(colMon.length<2||colMon[1]===colMon[0]):colMon[i]!==colMon[i-1];mons+=`<span>${show?colMon[i]+'月':''}</span>`;}
  const top=Object.entries(st.pods).sort((a,b)=>b[1].n-a[1].n).slice(0,6);
  const mx=top.length?top[0][1].n:1;
  const rows=top.map(([name,v])=>{
    const slug=POD_LOGO[v.en]||POD_LOGO[name];
    const ic=slug?`<img class="rk-logo" src="assets/pods/${slug}.webp" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='assets/pods/${slug}.jpg'">`:`<span class="rk-ini">${name.slice(0,2)}</span>`;
    return `<div class="rk-row">${ic}<span class="rk-name">${name}</span><span class="rk-bar" style="width:${Math.round(v.n/mx*220)}px"></span><span class="rk-n">${v.n} 期</span></div>`;}).join('');
  return `<div class="wrap"><section class="reveal">
    <div class="eyebrow">My Space · 我的</div><h2 class="title">我的</h2><div class="st-h2">我的数据</div>
    <div class="st-tiles">
      <div class="st-tile"><div class="n">${st.eps.length}</div><div class="l">已读期数</div></div>
      <div class="st-tile"><div class="n">${hrs}</div><div class="l">累计小时</div></div>
      <div class="st-tile"><div class="n">${st.streak.cur}</div><div class="l">连续天数</div><div class="s">最长 ${st.streak.max} 天</div></div>
      <div class="st-tile"><div class="n">${st.ppl}</div><div class="l">覆盖人物</div></div>
    </div>
    <div class="st-h3">阅读热力图</div>
    <div class="hm-wrap"><div class="hm">${cells}</div><div class="hm-months">${mons}</div></div>
    <div class="hm-legend">少 <i style="background:var(--surface-2);border:1px solid var(--line)"></i><i style="background:rgba(41,151,255,.25)"></i><i style="background:rgba(41,151,255,.45)"></i><i style="background:rgba(41,151,255,.7)"></i><i style="background:var(--accent)"></i> 多 · 每日阅读分钟数</div>
    <div class="st-h3">节目排行 · 我读得最多的频道</div>
    <div class="rk">${rows||'<div class="st-empty">暂无</div>'}</div>
    ${pushPanelHtml()}
    ${sharePromoHtml(st,hrs)}
    ${mineMarksHtml()}
  </section></div>`;
}

function readGet(){try{const r=JSON.parse(localStorage.readEpisodes||'[]');return new Set(Array.isArray(r)?r:[])}catch(e){return new Set()}}
function readHas(id){return readGet().has(id);}
function readMark(id,on){const s=readGet();const had=s.has(id);if(on===false)s.delete(id);else s.add(id);
  if(s.has(id)!==had){localStorage.readEpisodes=JSON.stringify([...s]);syncReadUI(id);syncTouch();
    const _e=EPISODES.find(x=>x.id===id);if(_e&&_e.min)rlogAdd(s.has(id)?_e.min:-_e.min);}
  if(on!==false)laterRemove(id);}   // 读完自动移出「稍后读」
function toggleRead(id){readMark(id,!readHas(id));}
function syncReadUI(id){const on=readHas(id);
  const b=document.getElementById('readBtn');if(b){b.classList.toggle('on',on);const l=b.querySelector('.rl');if(l)l.textContent=on?'已读 ✓':'标记已读';}
  document.querySelectorAll('.ep-card[data-id="'+id+'"]').forEach(c=>c.classList.toggle('read',on));}
/* 稍后读（想读清单）:localStorage.laterEpisodes;标记已读时自动移出 */
function laterGet(){try{const r=JSON.parse(localStorage.laterEpisodes||'[]');return Array.isArray(r)?r:[]}catch(e){return[]}}
function laterHas(id){return laterGet().includes(id);}
function toggleLater(id){
  let r=laterGet();r=r.includes(id)?r.filter(x=>x!==id):[...r,id];
  localStorage.laterEpisodes=JSON.stringify(r.slice(-100));syncLaterUI(id);syncTouch();
}
function laterRemove(id){const r=laterGet();if(r.includes(id)){localStorage.laterEpisodes=JSON.stringify(r.filter(x=>x!==id));syncLaterUI(id);syncTouch();}}
function syncLaterUI(id){const on=laterHas(id);
  const b=document.getElementById('laterBtn');if(b){b.classList.toggle('on',on);const l=b.querySelector('.ll');if(l)l.textContent=on?'已加待读 ★':'稍后读 ☆';}
  document.querySelectorAll('.ep-card[data-id="'+id+'"] .later-badge').forEach(x=>x.style.display=on?'inline-flex':'none');}
/* 上新徽标：上次来访之后收录、且 14 天内的期打 NEW(首次来访不打，避免满屏 NEW) */
const LAST_VISIT=localStorage.lastVisit||'';
{const _mark=()=>{localStorage.lastVisit=new Date().toISOString().slice(0,10);};   // 停留满 60s 或真正离开才算"来过",避免秒开秒关吃掉 NEW 徽标
 setTimeout(_mark,60000);addEventListener('pagehide',_mark);}
function isNew(e){if(!LAST_VISIT||!e.addedAt)return false;
  const cut=new Date(Date.now()-14*864e5).toISOString().slice(0,10);
  return e.addedAt>LAST_VISIT&&e.addedAt>=cut&&!readHas(e.id);}
/* 阅读位置记忆：readPos={epId:{s:章节号，n:总章数，t:时间}}，由目录观察器实时写入；
   打开单集时若有记录且无显式 ?at/?hl，则经 pendingLocate 通道自动回到上次位置 */
function readPosGet(){try{const r=JSON.parse(localStorage.readPos||'{}');return r&&typeof r==='object'?r:{}}catch(e){return{}}}
function readPosSave(id,s,n){
  const r=readPosGet();r[id]={s,n,t:Date.now()};
  const ks=Object.keys(r);if(ks.length>60){ks.sort((a,b)=>(r[a].t||0)-(r[b].t||0));ks.slice(0,ks.length-60).forEach(k=>delete r[k]);}
  try{localStorage.readPos=JSON.stringify(r)}catch(e){}
  syncTouch();
}
/* 阅读栏底部进度线（滚动百分比） */
let _progTick=false;
/* 阅读进度按**正文**算,不按整份文档算。文档里正文之前有标题/速览/洞察(实测占 4.0%)、
   之后有页脚与推荐(1.9%),按文档算会「一进来就有进度、读完正文才 98%」。
   起点 = 正文第一段顶碰到粘性栏下沿;终点 = 正文最后一段底碰到视口底部。
   范围缓存起来,文档高度变了(切字号/语言/展开译文)才重算 —— 344 段的 DOM 查询
   不能每帧都跑。 */
let _progBox=null,_progDocH=-1;
function progBounds(){
  const dh=document.documentElement.scrollHeight;
  if(_progBox!==null&&_progDocH===dh)return _progBox;
  _progDocH=dh;
  const els=document.querySelectorAll('.reader .turn,.reader .sec-h');
  if(!els.length)return _progBox=false;
  const rb=document.querySelector('.read-bar');
  const sticky=rb?Math.round(rb.getBoundingClientRect().bottom):100;   // 菜单栏+标题栏 的下沿
  const top=els[0].getBoundingClientRect().top+scrollY;
  const bot=els[els.length-1].getBoundingClientRect().bottom+scrollY;
  const start=top-sticky, end=bot-innerHeight;
  return _progBox=(end>start?{start,end}:false);
}
function progWidth(){
  const b=progBounds();
  if(!b)return 0;
  return Math.min(100,Math.max(0,(scrollY-b.start)/(b.end-b.start)*100));
}
addEventListener('scroll',()=>{
  if(_progTick)return;_progTick=true;
  requestAnimationFrame(()=>{_progTick=false;
    const bar=document.getElementById('readProg');if(!bar)return;
    bar.style.width=progWidth()+'%';
  });
},{passive:true});
/* 切字号/语言/顺序时锚定视口顶部内容，避免 reflow 后位置漂移 */
function keepAnchor(fn){
  const els=document.querySelectorAll('.reader .turn,.reader .sec-h');
  let anchor=null,off=0;
  for(const el of els){const r=el.getBoundingClientRect();if(r.bottom>96){anchor=el;off=r.top;break;}}
  fn();
  if(anchor)requestAnimationFrame(()=>{const top=anchor.getBoundingClientRect().top+scrollY-off;scrollTo(0,Math.max(0,top));});
}
function initReadMark(id){const end=document.getElementById('readEnd');if(!end||!('IntersectionObserver'in window))return;
  if(document.querySelector('.ts-loading'))return;                     // 全文加载中，等加载完 render 再设
  if(document.documentElement.scrollHeight<=innerHeight+400)return;     // 不足以滚动的短页，交给手动标记
  const io=new IntersectionObserver(es=>{es.forEach(x=>{if(x.isIntersecting){readMark(id,true);io.disconnect();}})},{rootMargin:'0px 0px -8% 0px'});
  io.observe(end);}
// 新手入门 5 期（手工精选，约一季度手调一次）
const STARTERS=['karpathy-training','hinton-alexkant-2026','demis-hugeiftr','dario-dwarkesh','jensen-dwarkesh'];
function vHome(){
  const feat=EPISODES.filter(e=>!e.stub).sort((a,b)=>(b.addedAt||'').localeCompare(a.addedAt||'')||(b.date||'').localeCompare(a.date||''))[0]||EPISODES[0],fp=PEOPLE[feat.pid];
  // 导语已移出内联,但 split_data 会给最新 FEAT_KEEP 期留一份 —— feat 恒在其中。
  // 万一排序口径漂移取到没留导语的一期,用标题兜底,不要让 undefined 漏到页面上。
  const featTurn=(feat.quotes&&feat.quotes[0])||(feat.insights&&feat.insights.consensus&&feat.insights.consensus[0])||
    {en:feat.sEn||feat.tEn||'',zh:feat.sZh||feat.tZh||''};
  return `
  <div class="site-tag">海外一线最新 AI 人物播客 · 中英对照全文<span class="st-n">${EPISODES.length} 期 · ${Object.keys(PEOPLE).length} 位</span></div>
  <div class="wrap hero">
    <div class="hero-card reveal">
      <div class="hero-art" style="background:${(()=>{const cs=fp.fields.map(fcolor);return cs.length>1?`linear-gradient(150deg,${cs.join(',')})`:(cs[0]||'var(--accent)');})()}"><div class="hero-cov"><span class="hc-pod">${(()=>{const s=POD_LOGO[feat.pod.en]||POD_LOGO[feat.pod.zh];return s?`<img src="assets/pods/${s}.webp" alt="" decoding="async" onerror="this.onerror=null;this.src='assets/pods/${s}.jpg'">`:'';})()}${feat.pod.zh}</span><span class="hc-ct"><b>${fp.en}</b><span>${(feat.date||'').replace(/-/g,'.')}${feat.min?' · '+feat.min+'m':''}</span></span></div>${av(feat.pid)}</div>
      <div class="hero-body">
        <div class="eyebrow">最新上线 · Latest</div>
        <h1>${feat.tZh||feat.tEn}</h1>
        <div class="hero-ten">${feat.tZh?feat.tEn:''}</div>
        <div class="who">${fp.en} · ${fp.zh} &nbsp;|&nbsp; ${feat.pod.zh}</div>
        <div class="quote">“${featTurn.en}”</div>
        <div class="quote-zh">“${featTurn.zh}”</div>
        <button class="btn" onclick="go('#/episode/${feat.id}')">读双语全文</button>
      </div>
    </div>
  </div>

  <section class="wrap reveal" style="padding-top:20px;padding-bottom:28px">
    <div class="ask-bar" onclick="go('#/ask')" title="问全站">
      <span class="ask-bar-ph">问关于 AI 的任何问题 —— 综合 ${Object.keys(PEOPLE).length} 位大佬、${EPISODES.length} 期播客的观点回答</span>
      <span class="ask-bar-btn">问全站</span>
    </div>
  </section>

  ${(()=>{const rec=recentGet().map(id=>EPISODES.find(e=>e.id===id)).filter(Boolean).slice(0,8);
   if(rec.length)return `<section class="wrap reveal" style="padding-top:8px;padding-bottom:0">
    <div class="eyebrow">Continue · 继续阅读</div>
    <h2 class="title">上次看到</h2>
    <div class="rail" style="margin-top:22px">${rec.map(epCard).join('')}</div>
  </section>`;
   const st=STARTERS.map(id=>EPISODES.find(e=>e.id===id)).filter(Boolean);
   return st.length?`<section class="wrap reveal" style="padding-top:8px;padding-bottom:0">
    <div class="eyebrow">Start here · 新手入门</div>
    <h2 class="title">第一次来？从这 ${st.length} 期开始</h2>
    <div class="sub">名人名场面，每期都值得完整读一遍。</div>
    <div class="rail" style="margin-top:22px">${st.map(epCard).join('')}</div>
  </section>`:'';})()}

  ${(()=>{const lt=laterGet().map(id=>EPISODES.find(e=>e.id===id)).filter(Boolean).filter(e=>!readHas(e.id)).reverse().slice(0,8);
   return lt.length?`<section class="wrap reveal" style="padding-top:8px;padding-bottom:0">
    <div class="eyebrow">Read later · 稍后读</div>
    <h2 class="title">我的待读 · ${lt.length}</h2>
    <div class="rail" style="margin-top:22px">${lt.map(epCard).join('')}</div>
  </section>`:'';})()}

  <section class="wrap reveal">
    <div class="row-head"><div>
      <div class="eyebrow">Latest · 最新单集</div>
      <h2 class="title">最新播客</h2>
      <div class="sub">知名 AI 人物的播客，中英双语对照全文。</div></div>
      <a class="see-all" onclick="go('#/browse')">查看全部 ${EPISODES.length} 期 →</a></div>
    <div class="rail" style="margin-top:22px">${EPISODES.slice(0,12).map(epCard).join('')}
      <div class="ep-card more-card" onclick="go('#/browse')"><div class="more-inner"><b>+${EPISODES.length-12}</b><span>查看全部单集</span></div></div>
    </div>
  </section>

  ${(()=>{
   // 「最近上新」按 addedAt(收录时间)排,只排除 stub。
   // 不排除头部大卡(feat):否则一次批量收录里"最新收录的那期"会被 hero 吃掉、从名为「最近收录」的列表里消失(用户曾反馈"刚加的没在最近收录里")。宁可 hero 与列表首卡少量重复,也要让列表名副其实。
   // 不再用「最新播客」的 date 前 12 做排除——否则一期 date 挤进前12就会从最近上新消失(即便它是最新收录)
   const ranked=EPISODES.slice().sort((a,b)=>(b.addedAt||'').localeCompare(a.addedAt||'')||(b.date||'').localeCompare(a.date||'')).filter(e=>!e.stub);
   // 至少 8 期;若最近一次是「批量收录」,把同一天 addedAt 的整批都显示（上限 20）,避免大批新收被截断
   const topDay=ranked[0]&&(ranked[0].addedAt||'').slice(0,10);
   const batch=topDay?ranked.filter(e=>(e.addedAt||'').slice(0,10)===topDay).length:0;
   const fresh=ranked.slice(0,Math.min(20,Math.max(8,batch)));
   return fresh.length?`<section class="wrap reveal" style="padding-top:8px">
    <div class="eyebrow">Recently added · 最近上新</div>
    <h2 class="title">最近收录</h2>
    <div class="sub">按收录时间排——老播客的新收录也在这里，别错过。</div>
    <div class="rail" style="margin-top:22px">${fresh.map(epCard).join('')}</div>
  </section>`:'';})()}

  <section class="wrap reveal" style="padding-top:8px">
    <div class="row-head"><div>
      <div class="eyebrow">Topics · 议题</div>
      <h2 class="title">同一议题，不同声音</h2></div>
      <a class="see-all" onclick="go('#/topics')">全部议题 →</a></div>
    <div class="topic-grid" style="margin-top:22px">
    ${TOPICS.defs.slice(0,8).map(d=>{const st=topicStat(d.slug);
      return `<div class="topic-card" onclick="go('#/topic/${d.slug}')">
        <div class="tc-zh">${d.zh}</div><div class="tc-en">${d.en}</div>
        <div class="tc-meta">${st.p} 位 · ${st.n} 条观点</div></div>`;}).join('')}
    </div>
  </section>

  <section class="wrap reveal" style="padding-top:8px">
    <div class="eyebrow">By field · 按领域浏览</div>
    <h2 class="title">按研究领域浏览</h2>
    <div class="chips" style="margin-top:20px">
      ${Object.keys(FIELDS).map(f=>`<span class="chip" onclick="go('#/browse?field=${f}')">${fdot(f)}${FIELDS[f].zh}</span>`).join('')}
    </div>
  </section>

  <section class="wrap reveal" style="padding-top:8px">
    <div class="eyebrow">People · 人物</div>
    <h2 class="title">${Object.keys(PEOPLE).length} 位 AI 人物</h2>
    <div class="ppl-grid home-ppl" style="margin-top:22px">${pplOrder().map(pplCard).join('')}<div class="ppl-card ppl-more" onclick="go('#/people')"><!--
      圆圈里原来写死「+(人物总数减 17)」,但首页到底列几位是 CSS 按宽度定的(≤640px 17 位、
      更宽 23 位),JS 算不出来 —— 桌面上那个数一直是错的。改成中性符号,准确总数在下面那行。
      注意:这段在模板字符串里,写美元花括号会被当成插值,别加。
   --><span class="pm-n">···</span><div class="n">查看全部人物</div><div class="cnt">共 ${Object.keys(PEOPLE).length} 位 →</div></div></div>
  </section>
  ${footer()}`;
}

// 人物按播客覆盖量排序，让覆盖充分的大佬靠前（避免知名人物被新加入的人埋没），同量保持原有顺序
function pplOrder(){const k=Object.keys(PEOPLE);return k.slice().sort((a,b)=>epsOf(b).length-epsOf(a).length||k.indexOf(a)-k.indexOf(b));}
function pplCard(pid){const p=PEOPLE[pid];const n=epsOf(pid).length;
  return `<div class="ppl-card" onclick="go('#/person/${pid}')">
    ${av(pid)}<div class="n">${p.en}</div><div class="nz">${p.zh}</div>
    <div class="ti">${p.tiZh}</div><div class="cnt">${n} 期播客</div></div>`;}

let pplFilter=null;
function vPeople(){
  const ids=pplOrder().filter(id=>!pplFilter||PEOPLE[id].fields.includes(pplFilter));
  return `<div class="wrap"><section class="reveal" style="padding-bottom:0">
    <div class="eyebrow">People · 人物</div><h2 class="title">AI 人物</h2>
    <div class="sub">按研究领域筛选，点击进入个人主页与全部播客。</div>
    <div class="chips" style="margin:22px 0 6px">
      <span class="chip ${!pplFilter?'on':''}" onclick="setPpl(null)">全部</span>
      ${Object.keys(FIELDS).map(f=>`<span class="chip ${pplFilter===f?'on':''}" onclick="setPpl('${f}')">${fdot(f)}${FIELDS[f].zh}</span>`).join('')}
    </div></section>
    <section class="reveal" style="padding-top:24px">
    <div class="ppl-grid">${ids.map(pplCard).join('')||'<div class="empty">该领域暂无人物</div>'}</div>
    </section></div>${footer()}`;
}
function setPpl(f){pplFilter=f;render();}

function vAsk(){
  chatMode='all';
  return `<div class="wrap"><section class="reveal" style="padding-bottom:0">
    <div class="eyebrow">Ask · 问全站</div>
    <h2 class="title">向 ${Object.keys(PEOPLE).length} 位 AI 人物提问</h2>
    <div class="sub">基于全站 ${EPISODES.length} 期播客的核心观点综合回答，对比不同人的看法；出处可点击直达原期。</div>
    <div class="chat askpage" style="margin-top:24px">
      <div class="chat-thread" id="chatThread">${renderThread('__all__')}</div>
      <div class="chat-sugg-row" id="chatSugg">${chatSuggHtml(null)}</div>
      <div class="chat-inp"><input id="chatInput" placeholder="问关于全站任何 AI 人物 / 议题…" onkeydown="if(event.key==='Enter')askEp()"><button onclick="askEp()">问</button></div>
      <div class="chat-note" id="chatNote">综合全站要点，必要时自动联网 · AI 生成可能有误，出处可点核对</div>
    </div>
  </section></div>${footer()}`;
}

function vTopics(){
  ensureTopics();   // 计数用内联 counts 即时渲染,顺手预取条目,点进议题就不用等
  return `<div class="wrap"><section class="reveal" style="padding-bottom:0">
    <div class="eyebrow">Topics · 议题</div><h2 class="title">同一议题，不同声音</h2>
    <div class="sub">把不同 AI 人物对同一关键议题的观点聚到一起，横向对照。点议题查看谁说了什么。</div>
    <div class="topic-grid" style="margin-top:26px">
    ${TOPICS.defs.map(d=>{const st=topicStat(d.slug);
      return `<div class="topic-card" onclick="go('#/topic/${d.slug}')">
        <div class="tc-zh">${d.zh}</div><div class="tc-en">${d.en}</div>
        <div class="tc-meta">${st.p} 位 · ${st.n} 条观点</div></div>`;}).join('')}
    </div></section></div>${footer()}`;
}
function vTopic(slug){
  const d=TOPICS.defs.find(x=>x.slug===slug);if(!d)return vTopics();
  if(!ensureTopics()){                        // 条目还没到:先出骨架,加载完自动重渲染
    const st=topicStat(slug);
    return `<div class="wrap"><section class="reveal" style="padding-bottom:0">
      <div class="back" onclick="go('#/topics')" style="margin-bottom:16px">‹ 全部议题</div>
      <div class="eyebrow">Topic · 议题</div><h2 class="title">${d.zh}</h2>
      <div class="sub">${d.en} · ${st.p} 位 AI 人物 · ${st.n} 条观点</div>
      <div class="topic-list" style="margin-top:28px">${skTopic()}</div>
    </section></div>${footer()}`;
  }
  const items=(TOPICS.items[slug]||[]);
  const byPid={};items.forEach(it=>{(byPid[it.pid]=byPid[it.pid]||[]).push(it)});
  const pids=Object.keys(byPid).sort((a,b)=>byPid[a][0].date<byPid[b][0].date?1:-1);
  const epTitle=ep=>{const e=EPISODES.find(x=>x.id===ep);return e?(e.tZh||e.tEn):'';};
  // 引用反查出处章节（与该期 insights 精确匹配），命中则深链 ?at= 直达原文
  const secOf=q=>{
    if(typeof q.sec==='number'&&q.sec>=0)return q.sec;   // 构建期(split_data)已标好出处章节
    const e=EPISODES.find(x=>x.id===q.ep);if(!e||!e.insights)return null;
    const hit=[...(e.insights.consensus||[]),...(e.insights.contrarian||[])].find(x=>x.en===q.en);
    return (hit&&typeof hit.sec==='number'&&hit.sec>=0)?hit.sec:null;};
  return `<div class="wrap"><section class="reveal" style="padding-bottom:0">
    <div class="back" onclick="go('#/topics')" style="margin-bottom:16px">‹ 全部议题</div>
    <div class="eyebrow">Topic · 议题</div><h2 class="title">${d.zh}</h2>
    <div class="sub">${d.en} · ${pids.length} 位 AI 人物 · ${items.length} 条观点</div>
    <div class="topic-list" style="margin-top:28px">
    ${pids.map(pid=>{const p=PEOPLE[pid]||{};const qs=byPid[pid];
      return `<div class="tp-person">
        <div class="tp-head" onclick="go('#/person/${pid}')">${av(pid)}<span class="tp-name">${p.en||pid}<i>${p.zh||''}</i></span></div>
        <div class="tp-quotes">${qs.map(q=>{const s=secOf(q);return `<div class="tp-q" onclick="go('#/episode/${q.ep}${s!=null?`?at=${s}`:''}')">
          <div class="tq-zh">${q.zh}</div><div class="tq-en">${q.en}</div>
          <div class="tq-src">${epTitle(q.ep)} · ${fmtDate(q.date)}${s!=null?' · 直达出处 ↦':''}</div></div>`;}).join('')}</div>
      </div>`;}).join('')}
    </div></section></div>${footer()}`;
}

function vFields(){
  return `<div class="wrap"><section class="reveal">
    <div class="eyebrow">Fields · 研究领域</div><h2 class="title">按领域浏览</h2>
    <div class="sub">复用 AI 人物图谱的领域分类法。</div>
    <div class="ppl-grid" style="margin-top:24px">
    ${Object.keys(FIELDS).map(f=>{const n=EPISODES.filter(e=>e.fields.includes(f)).length;const p=Object.keys(PEOPLE).filter(id=>PEOPLE[id].fields.includes(f)).length;
      return `<div class="ppl-card" onclick="go('#/browse?field=${f}')">
        <div class="av" style="width:96px;height:96px;font-size:30px;margin:0 auto 14px;background:${FIELDS[f].c}">${FIELDS[f].en[0]}</div>
        <div class="n">${FIELDS[f].zh}</div><div class="nz">${FIELDS[f].en}</div>
        <div class="cnt">${p} 人 · ${n} 期</div></div>`;}).join('')}
    </div></section></div>${footer()}`;
}

/* 播客 pid → 人物图谱节点 id(两边命名不同；deep link 到 ai.jasonlin.tech/?node= 会聚焦节点+弹卡片) */
const GRAPH_ID={brettadcock:'brettadcock',berntbornich:'berntbornich',abbeel:'abbeel',ajambrosino:'ajambrosino',albertgu:'albertgu',alexrives:'alexrives',alexwei:'alexwei',alibehrouz:'alibehrouz',altman:'altman',andrewng:'ng',antonoglou:'antonoglou',aravind:'aravindsrinivas',askell:'askell',awang:'awang',batson:'batson',bengio:'bengio',benmann:'benmann',boris:'bcherny',bricken:'bricken',brockman:'gregbrockman',bubeck:'bubeck',caitlin:'caitlin',catwu:'catwu',christiano:'christiano',danbiderman:'danbiderman',dario:'damodei',davidsp:'davidsp',delangue:'delangue',demis:'hassabis',dsilver:'silver',dylanpatel:'dylanpatel',edunov:'edunov',edwinchen:'edwinchen',elon:'musk',ericjang:'ericjang',ethanhe:'ethanhe',fedus:'fedus',feifei:'feifei',finn:'finn',fiona:'fiona',fulford:'fulford',gomez:'gomez',grantsanderson:'grantsanderson',hafner:'hafner',hasani:'hasani',hausman:'hausman',hendrycks:'hendrycks',hinton:'hinton',ilya:'sutskever',jackph:'jackph',jaderberg:'jaderberg',jasonwei:'wei',jeffdean:'dean',jensen:'jensen',jhoward:'jhoward',jimfan:'jimfan',joonpark:'joonpark',jumper:'jumper',justinjohnson:'justinjohnson',kaiser:'kaiser',kaplan:'jaredkaplan',karina:'karina',karpathy:'karpathy',kendall:'kendall',kohli:'pushmeetkohli',kolter:'kolter',lambert:'lambert',lample:'lample',laskin:'laskin',lecun:'lecun',leike:'janleike',llion:'jones',logankilpatrick:'logankilpatrick',malik:'malik',markchen:'markchen',mattwhite:'mattwhite',mensch:'mensch',mjordan:'mjordan',murati:'miramurati',nanda:'nanda',nando:'nando',naval:'naval',neelnanda:'nanda',noambrown:'noambrown',olah:'olah',oriol:'vinyals',pachocki:'pachocki',parada:'parada',pathak:'pathak',percyliang:'liang',pincus:'pincus',reinerpope:'reinerpope',robertlange:'robertlange',rohinshah:'rohinshah',schmidhuber:'schmidhuber',schulman:'schulman',scottwu:'scottwu',shanahan:'shanahan',shanelegg:'legg',shazeer:'shazeer',sholto:'sholto',slevine:'levine',springenberg:'springenberg',steinberger:'steinberger',suleyman:'suleyman',sutton:'sutton',tejal:'tejal',thomaswolf:'thomaswolf',tombrown:'brown',tridao:'tridao',truell:'truell',tworek:'tworek',varun:'varun',waldenyan:'waldenyan',wiltschko:'wiltschko',yejin:'yejin',mikekrieger:'mikekrieger',brettaylor:'brettaylor',billpeebles:'billpeebles',carinahong:'carinahong',danklein:'danklein',kokotajlo:'kokotajlo',linqiao:'linqiao',turley:'nickturley',diannepenn:'diannepenn',felixrieseberg:'felixrieseberg',satya:'satya',thariq:'thariq'};
const POD2PAPER={zvi:'zvi',abbeel:'abbeel',bubeck:'sebastienbubeck',thariq:'thariq',albertgu:'albertgu',alexwei:'alexwei',altman:'sam',antonoglou:'antonoglou',askell:'askell',bengio:'bengio',chowdhery:'achowdhery',christiano:'christiano',dario:'dario',demis:'demis',ermon:'sermon',fadell:'tonyfadell',fedus:'fedus',feifei:'feifei',finn:'finn',hafner:'dhafner',hinton:'hinton',ilya:'ilya',jasonwei:'jasonwei',jeffdean:'jeffdean',jimfan:'jimfan',jureleskovec:'jleskovec',justinjohnson:'justinjohnson',kaplan:'kaplan',karpathy:'karpathy',kendall:'kendall',kokotajlo:'kokotajlo',lambert:'nathanlambert',lecun:'lecun',leike:'leike',olah:'chrisolah',oriol:'oriol',satya:'satya',schulman:'schulman',shazeer:'shazeer',simonwillison:'simonwillison',slevine:'svlevine',sutton:'richsutton',tombrown:'tombrown',tridao:'tridao',tworek:'tworek',yejin:'yejin',raschka:'sebastianraschka',ethanmollick:'ethanmollick'};
const HW_GRAPH={jonyive:'jonyive',carlpei:'carlpei',fadell:'fadell',feldman:'feldman',hausman:'karolhausman',pathak:'skildai',suleyman:'suleyman',evanspiegel:'evanspiegel',lipbutan:'lipbutan',qasaryounis:'qasaryounis',gustav:'gustav',ivyross:'ivyross',zuckerberg:'zuckerberg',berntbornich:'berntbornich',brettadcock:'brettadcock'}; /* 播客 pid → hardware.jasonlin.tech 节点 */
const INV_GRAPH={garrytan:'garrytan',benedictevans:'benedictevans',altman:'samaltman',andreessen:'marca16z',jensen:'jensenhuang',danshipper:'danshipper',traviskalanick:'traviskalanick'}; /* 播客 pid → investor.jasonlin.tech 节点 */
const DESIGN_IDS=new Set(['jennywen','henrymodisett','eschavera','gunnargray','iansilber','meaghanchoi','joellewenstein','ryolu','nadchishtie','alejandromatamala','ammaarreshi','tuhinkumar','samstephenson','romantesliuk','jasonyuan','steveruiz','brianlovin','pablostanley','jonyive','dylanfield','susankare','katiedill']); /* 播客 pid==设计图谱 node id;跳 design.jasonlin.tech */
function vPerson(pid){
  const p=PEOPLE[pid];if(!p)return vHome();
  const eps=epsOf(pid);
  const gid=GRAPH_ID[pid];
  return `<div class="wrap">
    <div class="pp-head reveal">${av(pid)}
      <div><h1>${p.en}</h1><div class="nz">${p.zh}</div>
      <div class="ti">${p.tiEn} · ${p.tiZh}</div>
      <div class="chips">${PERSON_ORG[pid]?`<span class="chip" onclick="go('#/browse?org=${encodeURIComponent(PERSON_ORG[pid])}')">🏢 ${PERSON_ORG[pid]}</span>`:''}${p.fields.filter(f=>FIELDS[f]).map(f=>`<span class="chip" onclick="go('#/browse?field=${f}')">${fdot(f)}${FIELDS[f].zh}</span>`).join('')}</div>
      </div>
    </div>
    <div class="pp-bio reveal">
      <div class="en">${p.bioEn}</div><div class="zh">${p.bioZh}</div>
      <div class="xlinks">${gid?`<a class="xlink" href="https://ai.jasonlin.tech/?node=${gid}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6.5" r="2.1"/><circle cx="18" cy="8" r="2.1"/><circle cx="10.5" cy="18" r="2.1"/><path d="M8 7l7.9 1M8.1 8l1.8 8"/></svg>在关系图谱中查看</a>`:''}${HW_GRAPH[pid]?`<a class="xlink" href="https://hardware.jasonlin.tech/?node=${HW_GRAPH[pid]}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6.5" r="2.1"/><circle cx="18" cy="8" r="2.1"/><circle cx="10.5" cy="18" r="2.1"/><path d="M8 7l7.9 1M8.1 8l1.8 8"/></svg>在硬件图谱中查看</a>`:''}${INV_GRAPH[pid]?`<a class="xlink" href="https://investor.jasonlin.tech/?node=${INV_GRAPH[pid]}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6.5" r="2.1"/><circle cx="18" cy="8" r="2.1"/><circle cx="10.5" cy="18" r="2.1"/><path d="M8 7l7.9 1M8.1 8l1.8 8"/></svg>在投资图谱中查看</a>`:''}${DESIGN_IDS.has(pid)?`<a class="xlink" href="https://design.jasonlin.tech/?node=${pid}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6.5" r="2.1"/><circle cx="18" cy="8" r="2.1"/><circle cx="10.5" cy="18" r="2.1"/><path d="M8 7l7.9 1M8.1 8l1.8 8"/></svg>在设计图谱中查看</a>`:''}${POD2PAPER[pid]?`<a class="xlink" href="https://aipaper.jasonlin.tech/#/person/${POD2PAPER[pid]}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v4h4"/><path d="M9 13h6M9 17h4"/></svg>在 AI Paper 中读论文</a>`:''}</div>
    </div>
    <section class="reveal" style="padding-bottom:0">
      <div class="sec-h" style="margin-top:44px">本站收录 · ${eps.length} 期</div>
      <div class="ep-grid">${eps.map(epCard).join('')}</div>
    </section>
    ${/* 「观点演变」必须排在单集列表**之后**。2026-08-29 实测:它中位 5 条、占 850-900px,
        挡在前面时首张单集卡落在手机第 2.1 屏(altman/dario),而版式一模一样的节目页只要 0.7 屏。
        数据上对得起来 —— 节目页→单集 77%,人物页→单集 不到 15%,人物页出去 45% 是回首页。
        受影响的 98 个人物页恰恰是收录最多的那批:内容最厚的页面把自己的目录埋得最深。
        ensureViews() 是拉 data/views.json 的惰性触发器,跟着这段一起挪,别落下。 */''}
    ${(ensureViews(),VIEWS[pid]&&VIEWS[pid].length)?`<section class="reveal" style="padding-bottom:0">
      <div class="sec-h" style="margin-top:40px">观点演变 · How the views evolved<span class="evhint">由早及近</span></div>
      <ol class="viewlist">${VIEWS[pid].map(v=>`<li>${v.t?`<span class="vt">${v.t}</span>`:''}<span class="ve">${v.en}</span><span class="vz">${v.zh}</span></li>`).join('')}</ol>
    </section>`:''}
  </div>${footer()}`;
}

/* ----- PODCAST MEDIA DETAIL ----- */
/* ----- 全部节目索引(参考 aipaper 的 #/orgs 机构页):189 个节目源此前只能从某一期点进去,没有总览 ----- */
function podStats(){
  const m={};
  EPISODES.forEach(e=>{const k=e.pod&&e.pod.en;if(!k)return;
    (m[k]=m[k]||{n:0,zh:e.pod.zh||'',last:''});m[k].n++;
    if((e.date||'')>m[k].last)m[k].last=e.date||'';});
  return m;
}
function podCard(key,v){
  const lg=POD_LOGO[key]
    ? `<img src="assets/pods/${POD_LOGO[key]}.webp" alt="${key}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='assets/pods/${POD_LOGO[key]}.jpg'">`
    : '';
  const info=POD_INFO[key];
  const zh=v.zh&&v.zh!==key?v.zh:'';
  return `<div class="ppl-card" onclick="go('#/pod/${slugify(key)}')">
    <div class="av podav">${lg||key.replace(/^(The|A) /,'').slice(0,2)}</div>
    <div class="n">${key}</div>${zh?`<div class="nz">${zh}</div>`:''}
    ${info&&info.host?`<div class="ti">${info.host}</div>`:''}
    <div class="cnt">${v.n} 期</div></div>`;
}
function vPods(){
  const m=podStats();
  const list=Object.entries(m).sort((a,b)=>b[1].n-a[1].n||(b[1].last||'').localeCompare(a[1].last||''));
  return `<div class="wrap"><section class="reveal" style="padding-bottom:0">
    <div class="eyebrow">Shows · 节目</div><h2 class="title">按节目看播客</h2>
    <div class="sub">${list.length} 个节目源 · ${EPISODES.length} 期，看每档节目在本站收录了哪些人、哪些期。</div>
    </section>
    <section class="reveal" style="padding-top:24px">
    <div class="ppl-grid">${list.map(([k,v])=>podCard(k,v)).join('')}</div>
    </section></div>${footer()}`;
}

function vPod(slug){
  const key=POD_SLUG[slug];if(!key)return vHome();
  // 39 个节目没写 POD_INFO,以前会在这里被弹回首页;缺简介就只渲染标题 + 收录列表
  const info=POD_INFO[key]||{zh:'',host:'',en:'',cn:''};
  const eps=EPISODES.filter(e=>e.pod.en===key).sort((a,b)=>a.date<b.date?1:-1);
  const lg=POD_LOGO[key]
    ? `<img class="pod-logo-lg" src="assets/pods/${POD_LOGO[key]}.webp" alt="${key}" decoding="async" onerror="this.onerror=null;this.src='assets/pods/${POD_LOGO[key]}.jpg'">`
    : `<div class="pod-logo-lg fallback">${key.slice(0,2)}</div>`;
  return `<div class="wrap">
    <div class="pp-head reveal">${lg}
      <div><div class="eyebrow" style="color:var(--accent)">Podcast · 播客媒体</div>
      <h1>${key}</h1>${info.zh&&info.zh!==key?`<div class="nz">${info.zh}</div>`:''}
      ${info.host?`<div class="ti">主持 · ${info.host}</div>`:''}</div>
    </div>
    <div class="pp-bio reveal" ${info.en||info.cn||info.url?'':'hidden'}>
      <div class="en">${info.en}</div><div class="zh">${info.cn}</div>
      ${info.url?`<div class="xlinks"><a class="xlink" href="${info.url}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18"/></svg>访问官网</a></div>`:''}
    </div>
    <section class="reveal" style="padding-bottom:0">
      <div class="sec-h" style="margin-top:44px">本站收录 · ${eps.length} 期</div>
      <div class="ep-grid">${eps.map(epCard).join('')||'<div class="empty">暂无收录</div>'}</div>
    </section>
  </div>${footer()}`;
}

/* ----- BROWSE w/ filters: person / time / podcast / field ----- */
let bf={person:'',org:'',year:'',pod:'',field:'',read:''};
function vBrowse(){
  const people=[...new Set(EPISODES.map(e=>e.pid))];
  const years=[...new Set(EPISODES.map(e=>e.date.slice(0,4)))].sort().reverse();
  const pods=[...new Set(EPISODES.map(e=>e.pod.en))];
  /* 公司筛选:PERSON_ORG(pid→现职公司,由 pipeline/build_person_org.js 从人物职称栏解析生成,
     只信 tiEn 不信 bio——bio 提一句"曾在 X"就会被当现职,试过一次误配率 20%+)。
     按命中期数降序,让 OpenAI/Anthropic 这类大户排在前面,而不是字母序里被埋没。 */
  const orgCount={};
  EPISODES.forEach(e=>{const o=PERSON_ORG[e.pid];if(o)orgCount[o]=(orgCount[o]||0)+1;});
  const orgs=Object.keys(orgCount).sort((a,b)=>orgCount[b]-orgCount[a]);
  let list=EPISODES.filter(e=>(!bf.person||e.pid===bf.person)&&(!bf.org||PERSON_ORG[e.pid]===bf.org)&&(!bf.year||e.date.startsWith(bf.year))&&(!bf.pod||e.pod.en===bf.pod)&&(!bf.field||e.fields.includes(bf.field))&&(!bf.read||(bf.read==='read'?readHas(e.id):bf.read==='later'?laterHas(e.id):!readHas(e.id))));
  return `<div class="wrap"><section class="reveal" style="padding-bottom:0">
    <div class="eyebrow">Browse · 全部播客</div><h2 class="title">筛选与浏览</h2>
    <div class="filterbar">
      <select class="sel" onchange="bf.person=this.value;render()">
        <option value="">全部人物</option>${people.map(id=>`<option value="${id}" ${bf.person===id?'selected':''}>${PEOPLE[id].zh}</option>`).join('')}</select>
      <select class="sel" onchange="bf.org=this.value;render()">
        <option value="">全部公司</option>${orgs.map(o=>`<option value="${o}" ${bf.org===o?'selected':''}>${o}（${orgCount[o]}）</option>`).join('')}</select>
      <select class="sel" onchange="bf.year=this.value;render()">
        <option value="">全部时间</option>${years.map(y=>`<option value="${y}" ${bf.year===y?'selected':''}>${y} 年</option>`).join('')}</select>
      <select class="sel" onchange="bf.pod=this.value;render()">
        <option value="">全部播客</option>${pods.map(p=>`<option value="${p}" ${bf.pod===p?'selected':''}>${p}</option>`).join('')}</select>
      <select class="sel" onchange="bf.read=this.value;render()">
        <option value="">全部（读/未读）</option>
        <option value="read" ${bf.read==='read'?'selected':''}>只看已读</option>
        <option value="unread" ${bf.read==='unread'?'selected':''}>只看未读</option>
        <option value="later" ${bf.read==='later'?'selected':''}>只看稍后读 ★</option></select>
      <span style="width:1px;height:22px;background:var(--line)"></span>
      <span class="chip ${!bf.field?'on':''}" onclick="bf.field='';render()">全部领域</span>
      ${Object.keys(FIELDS).map(f=>`<span class="chip ${bf.field===f?'on':''}" onclick="bf.field='${f}';render()">${fdot(f)}${FIELDS[f].zh}</span>`).join('')}
    </div></section>
    <section class="reveal" style="padding-top:6px">
      <div class="sub" style="margin-bottom:18px">${list.length} 期结果${bf.org?`，来自 <b>${bf.org}</b> 员工/创始人`:''}</div>
      <div class="ep-grid">${list.map(epCard).join('')||'<div class="empty">没有匹配的播客，换个筛选试试</div>'}</div>
    </section></div>${footer()}`;
}

/* 文末「接着读」:同人物 → 同议题他人 → 同领域，未读优先，最多 4 期 */
function nextReads(e){
  const out=[],seen=new Set([e.id]);
  const push=x=>{if(x&&!seen.has(x.id)){seen.add(x.id);out.push(x);}};
  const unread=id=>!readHas(id);
  const same=epsOf(e.pid).filter(x=>x.id!==e.id);
  push(same.find(x=>unread(x.id))||same[0]);
  if(TOPICS.items){                    // 议题条目已在手(内联或已拉取):走原逻辑
    for(const slug in TOPICS.items){
      if((TOPICS.items[slug]||[]).some(it=>it.ep===e.id)){
        const other=(TOPICS.items[slug]||[]).find(it=>it.pid!==e.pid&&!seen.has(it.ep)&&unread(it.ep));
        if(other)push(EPISODES.find(x=>x.id===other.ep));
        break;
      }
    }
  }else if(typeof TOPIC_REL!=='undefined'){   // 未拉取:用构建期预算好的同议题候选(几 KB),推荐质量不降级
    const hit=(TOPIC_REL[e.id]||[]).find(id=>!seen.has(id)&&unread(id));
    if(hit)push(EPISODES.find(x=>x.id===hit));
  }
  // 领域兜底:按相关分排序(共享领域数×2 + 同频道 + 日期接近),同分随机避免千篇一律
  const score=x=>{let s=0;for(const ff of e.fields)if(x.fields.includes(ff))s+=2;
    if(x.pod&&e.pod&&x.pod.en===e.pod.en)s+=1;
    const dy=Math.abs((new Date(x.date||0))-(new Date(e.date||0)))/864e5;s+=Math.max(0,1-dy/365);
    return s;};
  const cands=EPISODES.filter(x=>x.id!==e.id&&x.pid!==e.pid&&!seen.has(x.id)&&unread(x.id)&&x.fields.some(ff=>e.fields.includes(ff)))
    .map(x=>({x,s:score(x)+Math.random()*0.3})).sort((a,b)=>b.s-a.s);
  for(const c of cands){if(out.length>=4)break;push(c.x);}
  return out.slice(0,4);
}

/* ----- READING VIEW (the core) ----- */
function vEpisode(id){
  const e=EPISODES.find(x=>x.id===id);if(!e)return vHome();
  recentAdd(id);
  if(typeof chatMode!=='undefined'&&window._lastChatEp!==id){chatMode='episode';window._lastChatEp=id;}
  const p=PEOPLE[e.pid];
  const loaded=(e.ts&&e.ts.length)||(id in TS_CACHE);   // 逐字稿是否已就位
  const ts=(e.ts&&e.ts.length)?e.ts:(TS_CACHE[id]||[]);
  const loading=!e.stub&&!loaded;                        // 按需加载逐字稿中
  if(loading)ensureTs(id);
  const body=(loading&&TS_ERR[id])
    ? `<div class="ts-loading">双语全文加载失败（网络波动）。<a style="color:var(--accent);cursor:pointer;margin-left:6px" onclick="tsRetry('${id}')">点此重试</a></div>`
    :loading
    ? `<div class="ts-loading" style="margin-bottom:18px"><span class="ts-spin"></span>正在加载双语全文…</div>`+
      Array.from({length:8},(_,k)=>`<div class="sk-turn">
        <div class="sk" style="width:88px;height:13px"></div>
        <div class="sk" style="width:${96-k%3*4}%"></div><div class="sk" style="width:${90-k%4*6}%"></div>
        <div class="sk" style="width:${84-k%3*8}%;opacity:.7"></div><div class="sk" style="width:${70-k%4*5}%;opacity:.7"></div>
      </div>`).join('')
    : ts.map((s,i)=>`
    <div class="sec-h" id="sec-${i}"><span class="se">${s.sec}</span><span class="sz">${s.secZh||s.sec}</span></div>
    ${(s.turns||[]).map((t,ti)=>{const g=t.spk===p.en.split(' ')[0]||t.spk===e.pid||t.spk===p.en;return `<div class="turn" data-sec="${i}" data-ti="${ti}"><div class="spk" style="color:${g?FIELDS[e.fields[0]].c:'var(--text-3)'};font-weight:${g?700:600}">${t.spk||''}</div>
      <div class="en">${t.en||''}</div><div class="zh">${t.zh||''}</div></div>`}).join('')}`).join('');
  const tocItems=ts.map((s,i)=>`<a class="toc-i" data-sec="${i}" onclick="jumpSec(${i})"><span class="se">${s.sec}</span><span class="sz">${s.secZh||s.sec}</span></a>`).join('');
  const hasToc=ts.length>=3;
  const insRow=(arr)=>arr.map(x=>{const j=(typeof x.sec==='number'&&x.sec>=0);return `<li${j?` class="jmp" onclick="jumpSec(${x.sec})" title="跳到原文出处"`:''}><span class="ie">${x.en}</span><span class="iz">${x.zh}</span></li>`}).join('');
  const brief=e.brief?`<div class="brief reveal in">
      <div class="br-h">速览 · TL;DR</div>
      <ul class="br-tldr">${(e.brief.tldr||[]).map(x=>`<li><span class="ie">${x.en}</span><span class="iz">${x.zh}</span></li>`).join('')}</ul>
      <div class="br-h br-h2">本期回答 · Answers</div>
      <ul class="br-qs">${(e.brief.qs||[]).map(x=>`<li><span class="ie">${x.en}</span><span class="iz">${x.zh}</span></li>`).join('')}</ul>
      <div class="br-meta">原音频 ${fmtDur(e.min)}${e.brief.words?` · 全文约 ${Math.max(1,Math.round(e.brief.words/220))} 分钟阅读`:''}</div>
    </div>`:(!EP_EXTRA_OK[e.id]?`<div class="sk-card reveal in">
      <div class="sk" style="width:110px;height:13px;margin-bottom:14px"></div>
      <div class="sk" style="width:92%;height:15px;margin-bottom:9px"></div><div class="sk" style="width:85%;height:15px;margin-bottom:9px"></div><div class="sk" style="width:88%;height:15px"></div>
    </div>`:'');
  const insights=e.insights?`<div class="insights reveal in">
      <div class="ins-col consensus"><div class="ins-h">核心观点 · Key points</div><ul>${insRow(e.insights.consensus||[])}</ul></div>
      <div class="ins-col contrarian"><div class="ins-h">反共识 · Contrarian</div><ul>${insRow(e.insights.contrarian||[])}</ul></div>
    </div>`:(!EP_EXTRA_OK[e.id]?`<div class="sk-card reveal in" style="min-height:180px">
      <div class="sk" style="width:150px;height:13px;margin-bottom:14px"></div>
      <div class="sk" style="width:90%;height:14px;margin-bottom:8px"></div><div class="sk" style="width:86%;height:14px;margin-bottom:8px"></div>
      <div class="sk" style="width:82%;height:14px;margin-bottom:8px"></div><div class="sk" style="width:88%;height:14px"></div>
    </div>`:'');
  const note=e.stub
    ? `<div class="stub-cta">
         <div class="t">本期已收录，双语全文待生成</div>
         <div class="s">真实节目元信息已登记。双语逐字稿可用转录管线一键生成（像本站的全文期那样）。</div>
         <a class="btn" href="${e.src}" target="_blank">收听 / 观看原节目</a>
       </div>`
    : loading ? ''
    : `<div class="note"><b>真实转录</b> · 来自 ${e.pod.en}（${fmtDate(e.date)}），字幕轨提取 + 带术语表的 AI 双语校对，左侧目录可跳转章节。完整音视频见 <a href="${e.src}" target="_blank" style="color:var(--accent)">原节目</a>。版权归原播客所有。译文为 AI 生成，个别词偶有瑕疵。</div>`;
  if(chatEpId!==id){chatEpId=id;chatMode='episode';}
  const ckey=chatMode==='all'?'__all__':id;
  const chat=e.stub?'':`<div class="chat reveal in">
      <div class="chat-top"><div class="chat-h">问答 · Ask</div>
        <div class="seg chat-seg" id="chatModeSeg">
          <button data-m="episode" class="${chatMode==='episode'?'on':''}" onclick="setChatMode('episode')">问这期</button>
          <button data-m="all" class="${chatMode==='all'?'on':''}" onclick="setChatMode('all')">问全站</button></div></div>
      <div class="chat-thread" id="chatThread">${renderThread(ckey)}</div>
      <div class="chat-sugg-row" id="chatSugg">${chatSuggHtml(e)}</div>
      <div class="chat-inp"><input id="chatInput" placeholder="${chatMode==='all'?'问关于全站任何 AI 人物/议题…':'问关于本期的任何问题…'}" onkeydown="if(event.key==='Enter')askEp()"><button onclick="askEp()">问</button></div>
      <div class="chat-note" id="chatNote">${chatMode==='all'?'综合全站要点，必要时自动联网':'优先本期内容，必要时自动联网'} · AI 生成可能有误，出处可点核对</div>
    </div>`;
  const reader=`
  <div class="reader">
    <div class="ep-head reveal in">
      <div class="pod" onclick="goPod('${e.pod.en}')" style="color:${fcolor(e.fields[0])};display:flex;align-items:center;gap:9px;cursor:pointer">${podLogo(e)}<span>${e.pod.en} · ${e.pod.zh}</span></div>
      <h1>${e.tEn}</h1><div class="hz">${e.tZh}</div>
      <div class="info">
        <span class="who" onclick="go('#/person/${e.pid}')">${av(e.pid)} ${p.en}</span>${POD2PAPER[e.pid]?`<span>·</span><a class="xsite-inline" href="https://aipaper.jasonlin.tech/#/person/${POD2PAPER[e.pid]}" target="_blank" rel="noopener" title="在 AI Paper 读 TA 的论文与长文"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H14l6 6v8.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Z"/><path d="M14 4v6h6" /></svg>读 TA 的论文</a>`:''}
        <span>·</span><span>${fmtDate(e.date)}</span><span>·</span><span>${fmtDur(e.min)}</span>
        <span>·</span>${e.fields.map(tag).join('')}
        ${hasToc?`<span>·</span><span>${ts.length} 章</span>`:''}
        <span>·</span><a class="srclink" href="${e.src}" target="_blank" rel="noopener"><svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-3"/><path d="M12 3h5v5"/><path d="M17 3l-8 8"/></svg>原节目</a>
      </div>
    </div>
    ${brief}
    ${insights}
    <div id="askInline">${chat}</div>
    ${body}
    ${(!e.stub&&!loading)?(()=>{const ns=nextReads(e);return ns.length?`
    <div class="eyebrow" style="margin-top:56px">Up next · 接着读</div>
    <div class="ep-grid" style="margin-top:16px">${ns.map(epCard).join('')}</div>`:'';})():''}
    ${note}
    <div id="readEnd" aria-hidden="true"></div>
  </div>`;
  const aside=chat?`<aside class="askside" id="askDesk"></aside>`:'';
  return `
  <div class="read-bar">
    <div class="read-prog" id="readProg"></div>
    <div class="back" onclick="goBack('${e.pid}')">‹ <b>${p.zh} · ${e.pod.zh}</b></div>
    <div class="tools">
      <div class="seg" id="langSeg">
        <button onclick="setLang('en')">EN</button><button onclick="setLang('zh')">中</button><button onclick="setLang('both')">双语</button></div>
      <div class="rb-drop" id="rbDrop">
      <div class="seg" id="sizeSeg">
        <button onclick="setSize('s')">小</button><button onclick="setSize('m')">中</button><button onclick="setSize('l')">大</button></div>
      <button id="orderBtn" class="ordbtn" onclick="toggleOrder()" title="切换原文/译文在前"><span class="ol">原文在前</span></button>
      <button id="shareBtn" class="ordbtn" onclick="copyShare('${e.id}')" title="复制本期分享链接（预览显示该期标题）">分享</button>
      <button id="readBtn" class="ordbtn readbtn${readHas(e.id)?' on':''}" onclick="toggleRead('${e.id}')" title="标记本期为已读/未读"><span class="rl">${readHas(e.id)?'已读 ✓':'标记已读'}</span></button>
      <button id="laterBtn" class="ordbtn laterbtn${laterHas(e.id)?' on':''}" onclick="toggleLater('${e.id}')" title="加入/移出稍后读清单"><span class="ll">${laterHas(e.id)?'已加待读 ★':'稍后读 ☆'}</span></button>
      </div>
      <button class="rb-more" onclick="rbToggle(event)" aria-label="更多操作">⋯</button>
    </div>
  </div>
  ${hasToc ? `<div class="read-wrap">
    <nav class="toc"><div class="toc-h">目录 · Contents</div>${tocItems}</nav>
    ${reader}
    ${aside}
  </div>
  <button class="toc-fab" onclick="toggleTocSheet()">目录</button>
  <div class="toc-sheet" id="tocSheet" onclick="if(event.target===this)toggleTocSheet()">
    <div class="panel"><div class="sh-h">目录 · Contents</div>${tocItems}</div>
  </div>` : (aside?`<div class="read-wrap read-wrap-notoc">${reader}${aside}</div>`:reader)}`;
}

/* ============================ TOC 目录 ============================ */
let tocObserver=null;
function jumpSec(i){const el=document.getElementById('sec-'+i);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
  const sh=$('#tocSheet');if(sh)sh.classList.remove('on');}
function rbToggle(ev){if(ev)ev.stopPropagation();const b=document.querySelector('.read-bar');if(b)b.classList.toggle('rb-open');}
addEventListener('click',e=>{const b=document.querySelector('.read-bar.rb-open');if(b&&!b.contains(e.target))b.classList.remove('rb-open');});
function toggleTocSheet(){const sh=$('#tocSheet');if(!sh)return;sh.classList.toggle('on');
  if(sh.classList.contains('on')){const on=sh.querySelector('.toc-i.on');if(on&&on.scrollIntoView)on.scrollIntoView({block:'center'});}}
function setTocActive(i,total){
  document.querySelectorAll('.toc-i').forEach(a=>a.classList.toggle('on',+a.dataset.sec===i));
  const n=total||document.querySelectorAll('.reader .sec-h').length;
  const fab=document.querySelector('.toc-fab');if(fab&&n)fab.textContent=`目录 · ${i+1}/${n}`;
  const t=document.querySelector('.toc'),el=t&&t.querySelector('.toc-i.on');   // 长目录跟随当前章
  if(el&&(el.offsetTop<t.scrollTop+40||el.offsetTop>t.scrollTop+t.clientHeight-60))t.scrollTop=el.offsetTop-t.clientHeight/2;
}
function initTOC(){
  if(tocObserver){tocObserver.disconnect();tocObserver=null;}
  const heads=[...document.querySelectorAll('.reader .sec-h')];
  if(!heads.length)return;
  setTocActive(0,heads.length);
  const epid=(location.hash||'').split('/episode/')[1]?(location.hash.split('/episode/')[1].split('?')[0]):'';
  tocObserver=new IntersectionObserver(es=>{
    const vis=es.filter(e=>e.isIntersecting).map(e=>heads.indexOf(e.target));
    if(vis.length){const i=Math.min(...vis);setTocActive(i,heads.length);
      if(epid&&!pendingLocate)readPosSave(epid,i,heads.length);}   // 定位还没完成时不覆盖旧进度
  },{rootMargin:'-115px 0px -72% 0px',threshold:0});
  heads.forEach(h=>tocObserver.observe(h));
}

/* ====== 逐字稿按需加载（首屏只装元数据，打开单集再拉全文，显著提速） ====== */
const EP_EXTRA_OK={};                 // 哪几集的核心观点/速览已到位(随 ep/<id>.json 一起来)
/* 全站观点句检索用的索引:只有打开搜索面板才拉,首屏不碰 */
let _extraLoading=false;
function ensureExtra(){
  if(window._extraReady||_extraLoading)return;
  _extraLoading=true;
  fetch('data/ep-extra.json').then(r=>r.ok?r.json():Promise.reject(r.status)).then(x=>{
    const by={};EPISODES.forEach(e=>{by[e.id]=e;});
    for(const id in x){const e=by[id];if(e){if(!e.insights)e.insights=x[id].insights;if(!e.brief)e.brief=x[id].brief;
      if(!e.sEn&&x[id].sEn)e.sEn=x[id].sEn;if(!e.sZh&&x[id].sZh)e.sZh=x[id].sZh;   // 导语:搜索要拿它当匹配串
      EP_EXTRA_OK[id]=1;}}
    window._extraReady=true;
    if($('#searchOverlay').classList.contains('on'))searchInput($('#searchInput').value||'');   // 索引到了就地重搜
  }).catch(()=>{_extraLoading=false;});
}
const TS_CACHE={};let _tsLoading=null;
const TS_ERR={};
function ensureTs(id){
  if((id in TS_CACHE)||_tsLoading===id)return;
  _tsLoading=id;delete TS_ERR[id];
  fetch('mcp-data/ep/'+id+'.json').then(r=>r.ok?r.json():Promise.reject(r.status))
    .then(j=>{TS_CACHE[id]=j.transcript||[];
      /* 核心观点/速览就在这个文件里,顺手回填 —— 单集页因此不必再等 data/ep-extra.json 整包 */
      const e=EPISODES.find(x=>x.id===id);
      if(e){if(j.insights&&Object.keys(j.insights).length&&!e.insights)e.insights=j.insights;
            if(j.brief&&!e.brief)e.brief=j.brief;
            /* 导语已移出内联(见 pipeline/split_data.py):这个文件里现成就有,补回来 —— 
               finally 里的 render() 会重跑 updateMeta,单集页的 meta description/微信分享摘要就齐了 */
            if(j.sEn&&!e.sEn)e.sEn=j.sEn;if(j.sZh&&!e.sZh)e.sZh=j.sZh;}
      EP_EXTRA_OK[id]=1;})
    .catch(()=>{TS_ERR[id]=1;})   // 不缓存失败:留重试机会
    .finally(()=>{_tsLoading=null;
      if((location.hash||'').indexOf('/episode/'+id)>=0){const y=scrollY;render();scrollTo(0,y);}});
}
function tsRetry(id){delete TS_ERR[id];ensureTs(id);render();}

/* ============================ TTS 选中朗读 ============================ */
/* 朗读经 Cloudflare Worker 代理（密钥存于 Worker，不在前端/仓库）。部署见 tts-worker/README.md。
   若你的 workers.dev subdomain 不同，改这里为 wrangler deploy 输出的实际地址。 */
addEventListener('scroll',()=>{const b=document.getElementById('selBar');if(!b||b.style.display==='none')return;if(b.classList.contains('dock'))return;const t=document.getElementById('ttsBtn');if(t&&t.classList.contains('loading'))return;b.style.display='none';},{passive:true});
const TTS_PROXY='https://tts.jasonlin.tech';
let ttsAudio=null;
function inReader(node){const el=node&&node.nodeType===3?node.parentElement:node;return !!(el&&el.closest&&el.closest('.reader')&&!el.closest('.chat'));}
let _selPeek=null,_peekHold=false,_selMark=null;
function ttsCheckSel(){
  const bar=$('#selBar'),btn=$('#ttsBtn');if(!bar||!btn)return;
  const sel=window.getSelection();const text=(sel?sel.toString():'').trim();
  if(text.length<2||!sel.anchorNode||!inReader(sel.anchorNode)){bar.style.display='none';bar.classList.remove('dock');return;}
  if(btn.classList.contains('loading'))return;  // 朗读处理中不因新选区重置
  const r=sel.getRangeAt(0).getBoundingClientRect();
  bar.style.display='flex';btn.classList.remove('playing');
  btn.querySelector('.lbl').textContent='朗读所选';
  const sb=$('#shareSelBtn');if(sb)sb.textContent='分享';
  // 手机（≤900px）:改为底部固定工具条，不与系统文本菜单抢选区位置，滚动不消失
  const dock=matchMedia('(max-width:900px)').matches;
  bar.classList.toggle('dock',dock);
  if(dock){bar.style.left='';bar.style.top='';}
  else{bar.style.left=(window.scrollX+r.left+r.width/2)+'px';
       bar.style.top=(window.scrollY+(r.top<150?r.bottom+12:r.top-46))+'px';}
  btn.dataset.text=text;
  btn.dataset.sec=selSecIndex();   // 选中时即记下所在章节（手机点按钮时选区已没了，不能临时算）
  // 存「看译文」所需的选区落点（单语模式点按钮时选区已丢，须此刻记下）
  _selPeek=null;_selMark=null;
  try{
    const nd=sel.anchorNode.nodeType===3?sel.anchorNode.parentElement:sel.anchorNode;
    const turn=nd&&nd.closest?nd.closest('.turn'):null;
    if(turn){const srcIsEn=!!nd.closest('.en');
      if(srcIsEn||nd.closest('.zh')){
        const src=turn.querySelector(srcIsEn?'.en':'.zh');
        const rg=sel.getRangeAt(0);
        let a=offsetInEl(src,rg.startContainer,rg.startOffset),b2=offsetInEl(src,rg.endContainer,rg.endOffset);
        if(b2<a)[a,b2]=[b2,a];
        _selPeek={turn,srcIsEn,mid:Math.min((src.textContent.length||1)-1,Math.max(0,(a+b2)/2))};
        if(turn.dataset.sec!=null&&b2>a)_selMark={id:hlEpId(),sec:+turn.dataset.sec,ti:+turn.dataset.ti,lang:srcIsEn?'en':'zh',text:src.textContent.slice(a,b2),s:a,e:b2};}}
  }catch(_){}
  const pk=$('#peekSelBtn');if(pk){pk.textContent=document.body.dataset.lang==='zh'?'看原文':'看译文';pk.style.display=_selPeek?'':'none';}
  const mk=$('#markSelBtn');if(mk)mk.style.display=_selMark?'':'none';
}
/* 单语模式下显式「看译文/看原文」:就地展开对应句（不自动弹出，避免打扰） */
function peekSel(){
  if(!_selPeek||!_selPeek.turn||!document.contains(_selPeek.turn))return;
  clearCross();
  crossMark(_selPeek.turn,_selPeek.srcIsEn,_selPeek.mid);
  _peekHold=true;   // 防止紧随的 touchend→syncCross 立刻清掉
}
/* ====== 划线标记(选中→标记→下划线;「我的标记」汇总;随同步码同步) ====== */
function hlGet(){try{const x=JSON.parse(localStorage.highlights||'{}');return x&&typeof x==='object'?x:{}}catch(e){return{}}}
function hlSave(x){try{localStorage.highlights=JSON.stringify(x)}catch(_){}}
function hlEpId(){const p=(location.hash||'').slice(2).split('?')[0].split('/');return p[0]==='episode'?p[1]:'';}
function hlCount(){return Object.values(hlGet()).reduce((n,a)=>n+(a?a.length:0),0);}
function hlNodeAt(el,off){const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let n,acc=0;while(n=w.nextNode()){const len=n.nodeValue.length;if(off<=acc+len)return[n,off-acc];acc+=len;}return[null,0];}
function hlWrap(el,s,e,idx){const[sn,so]=hlNodeAt(el,s),[en,eo]=hlNodeAt(el,e);if(!sn||!en)return false;try{const r=document.createRange();r.setStart(sn,so);r.setEnd(en,eo);const sp=document.createElement('span');sp.className='hl';sp.dataset.hi=idx;sp.title='点击移除标记';sp.addEventListener('click',hlClick);r.surroundContents(sp);return true;}catch(_){return false;}}
function applyHls(){const id=hlEpId();if(!id)return;const arr=hlGet()[id]||[];const byT={};arr.forEach((hh,idx)=>{const k=hh.sec+'|'+hh.ti+'|'+hh.lang;(byT[k]=byT[k]||[]).push(Object.assign({idx},hh));});for(const key in byT){const kp=key.split('|'),sec=kp[0],ti=kp[1],lang=kp[2];const turn=document.querySelector('.reader .turn[data-sec="'+sec+'"][data-ti="'+ti+'"]');if(!turn)continue;const el=turn.querySelector('.'+lang);if(!el)continue;byT[key].sort((a,b)=>b.s-a.s).forEach(hh=>hlWrap(el,hh.s,hh.e,hh.idx));}}
function markSel(){if(!_selMark||!_selMark.text||!_selMark.id){hlHideSel();return;}const id=_selMark.id,st=hlGet(),arr=st[id]||(st[id]=[]);if(arr.some(hh=>hh.sec===_selMark.sec&&hh.ti===_selMark.ti&&hh.lang===_selMark.lang&&!(_selMark.e<=hh.s||_selMark.s>=hh.e))){hlToast('这段已标记');hlHideSel();return;}arr.push({sec:_selMark.sec,ti:_selMark.ti,lang:_selMark.lang,text:_selMark.text,s:_selMark.s,e:_selMark.e,ts:Date.now()});hlSave(st);if(typeof syncTouch==='function')syncTouch();const turn=document.querySelector('.reader .turn[data-sec="'+_selMark.sec+'"][data-ti="'+_selMark.ti+'"]');if(turn){const el=turn.querySelector('.'+_selMark.lang);if(el)hlWrap(el,_selMark.s,_selMark.e,arr.length-1);}hlToast('已标记 · 在「标记」查看');hlUpdNav();hlHideSel();}
function hlClick(ev){ev.stopPropagation();const idx=+ev.currentTarget.dataset.hi;const id=hlEpId();if(confirm('移除这条标记？'))hlRemove(id,idx);}
function hlRemove(id,idx){const st=hlGet(),arr=st[id]||[];if(arr[idx]){arr.splice(idx,1);if(!arr.length)delete st[id];hlSave(st);if(typeof syncTouch==='function')syncTouch();const y=scrollY;render();scrollTo(0,y);}}
function hlHideSel(){const b=$('#selBar');if(b){b.style.display='none';b.classList.remove('dock');}try{const s=window.getSelection();s&&s.removeAllRanges&&s.removeAllRanges();}catch(_){}}
let _hlTT=null;function hlToast(m){let t=$('#hlToast');if(!t){t=document.createElement('div');t.id='hlToast';t.className='hl-toast';document.body.appendChild(t);}t.textContent=m;t.classList.add('on');clearTimeout(_hlTT);_hlTT=setTimeout(()=>t.classList.remove('on'),1800);}
function hlUpdNav(){}
function hlJump(id,sec,idx){const it=(hlGet()[id]||[])[idx];pendingLocate={id,at:sec,hl:it?it.text:''};go('#/episode/'+id);}
function vMarks(){const hm=hlGet();const eps=Object.keys(hm).filter(id=>hm[id]&&hm[id].length).map(id=>({id,e:EPISODES.find(x=>x.id===id),items:hm[id]})).filter(x=>x.e);eps.forEach(x=>x.last=Math.max.apply(null,x.items.map(i=>i.ts||0)));eps.sort((a,b)=>b.last-a.last);const total=eps.reduce((n,x)=>n+x.items.length,0);if(!total)return `<div class="wrap"><section class="reveal" style="min-height:50vh"><div class="eyebrow">My highlights · 划线收藏</div><h2 class="title">我的标记</h2><div class="empty" style="margin-top:20px">还没有标记。阅读单集时选中文字，点弹出的「标记」即可划上下划线收藏，这里会汇总。</div></section></div>`;const body=eps.map(x=>`<div class="mk-ep"><div class="mk-eph" onclick="go('#/episode/${x.id}')"><b>${x.e.tZh}</b><span>${PEOPLE[x.e.pid]?PEOPLE[x.e.pid].zh:''} · ${x.items.length} 条</span></div>${x.items.map((it,idx)=>`<div class="mk-item"><span class="mk-q" onclick="hlJump('${x.id}',${it.sec},${idx})">${(it.text||'').replace(/</g,'&lt;')}</span><button class="mk-del" title="删除这条标记" onclick="hlRemove('${x.id}',${idx})">×</button></div>`).join('')}</div>`).join('');return `<div class="wrap"><section class="reveal"><div class="eyebrow">My highlights · 划线收藏</div><h2 class="title">我的标记 · ${total}</h2><div class="sub">阅读时选中文字点「标记」划线；这里汇总全部标记，点文字跳回原文。随同步码在设备间同步。</div><div class="marks-list" style="margin-top:22px">${body}</div></section></div>`;}
function selSecIndex(){
  const node=window.getSelection().anchorNode;if(!node)return -1;
  let el=node.nodeType===3?node.parentElement:node;
  const turn=el&&el.closest?el.closest('.turn'):null;if(!turn)return -1;
  let p=turn.previousElementSibling;
  while(p){if(p.classList&&p.classList.contains('sec-h')){const mm=(p.id||'').match(/sec-(\d+)/);return mm?+mm[1]:-1;}p=p.previousElementSibling;}
  return -1;
}
async function shareSel(){
  const btn=$('#ttsBtn');const text=((btn&&btn.dataset.text)||'').trim();if(!text)return;
  track('share');
  const m=(location.hash||'').match(/#\/episode\/([^?]+)/);
  const id=m?m[1]:'';const e=id&&EPISODES.find(x=>x.id===id);
  const quote=text.length>80?text.slice(0,80)+'…':text;            // 截断 80 字 + 省略号
  const who=e?`— ${PEOPLE[e.pid].zh}《${e.tZh||e.tEn}》`:'— AI Podcast';
  let url=id?('https://aipodcast.jasonlin.tech/e/'+id+'/'):'https://aipodcast.jasonlin.tech';
  const si=parseInt((btn&&btn.dataset.sec),10);
  if(id&&si>=0)url+='?at='+si+'&hl='+encodeURIComponent(text.slice(0,40));   // 携带定位：章节+文本片段
  const body=`「${quote}」\n${who}\n${url}`;
  // 全部放进 text(很多 App 同时给 text+url 时只取 url、丢正文)
  if(navigator.share){try{await navigator.share({title:'AI Podcast',text:body});return;}catch(_){}}
  const sb=$('#shareSelBtn');
  try{await navigator.clipboard.writeText(body);if(sb){sb.textContent='已复制';setTimeout(()=>sb.textContent='分享',1600);}}
  catch(_){if(sb){sb.textContent='复制失败';setTimeout(()=>sb.textContent='分享',1600);}}
}
let ttsBarChars=null,ttsBlobUrl=null;
const escHtml=s=>s.replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
function ttsStop(hide){
  document.documentElement.style.setProperty('--tts-h','0px');
  // 保留 audio 元素复用（iOS 解锁状态跟随元素），只停播+清理回调
  if(ttsAudio){ttsAudio.pause();ttsAudio.ontimeupdate=null;ttsAudio.onended=null;try{ttsAudio.removeAttribute('src');ttsAudio.load();}catch(_){}}
  if(ttsBlobUrl){URL.revokeObjectURL(ttsBlobUrl);ttsBlobUrl=null;}
  const pp=$('#ttsBar .tb-pp');if(pp)pp.textContent='暂停';
  const bar=$('#ttsBar');if(bar)bar.classList.remove('on');
  ttsBarChars=null;
  const btn=$('#ttsBtn');if(btn){btn.classList.remove('playing','loading');
    btn.querySelector('.lbl').textContent='朗读所选';}
  if(hide){const sb=$('#selBar');if(sb)sb.style.display='none';}
}
/* 播完进入「可重播」态；暂停/继续/重播；进度条点按跳转 */
function ttsEnded(){
  const btn=$('#ttsBtn');if(btn){btn.classList.remove('playing');btn.querySelector('.lbl').textContent='朗读所选';}
  const pp=$('#ttsBar .tb-pp');if(pp)pp.textContent='重播';
  const bar=$('#ttsBar');if(bar)bar.style.setProperty('--p','100%');
}
function ttsPP(){
  if(!ttsAudio||!ttsAudio.src)return;
  const pp=$('#ttsBar .tb-pp'),btn=$('#ttsBtn');
  if(ttsAudio.ended||(ttsAudio.duration&&ttsAudio.currentTime>=ttsAudio.duration-0.05)){ttsAudio.currentTime=0;ttsAudio.play();if(pp)pp.textContent='暂停';}
  else if(ttsAudio.paused){ttsAudio.play();if(pp)pp.textContent='暂停';}
  else{ttsAudio.pause();if(pp)pp.textContent='继续';}
  if(btn){btn.classList.toggle('playing',!ttsAudio.paused);btn.querySelector('.lbl').textContent=ttsAudio.paused?'朗读所选':'停止朗读';}
}
function ttsSeek(ev){
  if(!ttsAudio||!isFinite(ttsAudio.duration)||!ttsAudio.duration)return;
  const r=ev.currentTarget.getBoundingClientRect();
  ttsAudio.currentTime=Math.max(0,Math.min(1,(ev.clientX-r.left)/r.width))*ttsAudio.duration;
  const bar=$('#ttsBar');if(bar)bar.style.setProperty('--p',(ttsAudio.currentTime/ttsAudio.duration*100)+'%');
}
function ttsBarToggle(){
  const bar=$('#ttsBar');if(!bar)return;
  const min=bar.classList.toggle('min');localStorage.ttsMin=min?'1':'0';
  bar.querySelector('.tb-toggle').textContent=min?'展开':'收起';
  requestAnimationFrame(()=>document.documentElement.style.setProperty('--tts-h',Math.min(bar.offsetHeight||120,innerHeight*0.34)+'px'));
}
function ttsRate(){const r=parseFloat(localStorage.ttsRate);return r>=0.5&&r<=2?r:1;}
function ttsSetRate(v){
  const r=Math.max(0.5,Math.min(2,parseFloat(v)||1));localStorage.ttsRate=r;
  if(ttsAudio)ttsAudio.playbackRate=r;
  const lab=$('#ttsBar .tb-rate');if(lab)lab.textContent=r.toFixed(1)+'×';
  const inp=$('#ttsRate');if(inp&&+inp.value!==r)inp.value=r;
}
function ttsBuildBar(align,text){
  const bar=$('#ttsBar');if(!bar)return;const body=bar.querySelector('.tb-body');
  const ch=align&&align.characters, st=align&&(align.character_start_times_seconds||[]);
  if(ch&&ch.length){
    body.innerHTML=ch.map((c,i)=>c==='\n'?'<br>':`<span data-t="${st[i]||0}">${escHtml(c)}</span>`).join('');
    ttsBarChars=[...body.querySelectorAll('span')];
  }else{body.textContent=text;ttsBarChars=null;}   // 无时间戳：仅显示文本
  const min=localStorage.ttsMin==='1';              // 默认展开跟读条（字符级高亮是核心卖点）;用户收起则记住
  bar.classList.toggle('min',min);
  bar.querySelector('.tb-toggle').textContent=min?'展开':'收起';
  bar.style.setProperty('--p','0%');
  ttsSetRate(ttsRate());                            // 同步倍速 UI 到当前值
  bar.classList.add('on');
  document.documentElement.style.setProperty('--tts-h',Math.min(bar.offsetHeight||120,innerHeight*0.34)+'px');
}
function ttsTick(){
  const bar=$('#ttsBar');if(!ttsAudio||!bar)return;
  if(ttsAudio.duration)bar.style.setProperty('--p',(ttsAudio.currentTime/ttsAudio.duration*100)+'%');
  if(!ttsBarChars)return;
  const t=ttsAudio.currentTime;let cur=-1;
  for(let i=0;i<ttsBarChars.length;i++){if(+ttsBarChars[i].dataset.t<=t)cur=i;else break;}
  for(let i=0;i<ttsBarChars.length;i++){const s=ttsBarChars[i];
    s.classList.toggle('spoken',i<cur);s.classList.toggle('cur',i===cur);}
  if(cur>=0&&!bar.classList.contains('min')){const c=ttsBarChars[cur],b=bar.querySelector('.tb-body');
    const cr=c.getBoundingClientRect(),br=b.getBoundingClientRect();
    if(cr.bottom>br.bottom-8||cr.top<br.top+8)c.scrollIntoView({block:'center',behavior:'smooth'});}
}
const TTS_SILENT='data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
async function ttsPlay(){
  const btn=$('#ttsBtn');const text=btn.dataset.text;if(!text)return;
  if(btn.classList.contains('loading'))return;                 // 处理中：忽略重复点击
  if(ttsAudio&&!ttsAudio.paused){ttsStop(false);return;}
  // iOS 自动播放解锁：在用户手势内同步激活 audio 元素（播一段静音），真音频取回后复用同一元素
  if(!ttsAudio)ttsAudio=new Audio();
  try{ttsAudio.src=TTS_SILENT;const p=ttsAudio.play();if(p&&p.catch)p.catch(()=>{});}catch(_){}
  btn.classList.add('loading');btn.classList.remove('playing');btn.querySelector('.lbl').textContent='处理中…';
  try{
    const r=await fetch(TTS_PROXY,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({text:text.slice(0,2500)})});
    if(!r.ok){
      let msg=`HTTP ${r.status}`;
      try{const j=JSON.parse(await r.text());const dt=j.detail||j;const code=(dt.code||'')+'';
        if(/quota/i.test(code)||/quota/i.test(dt.message||'')) msg='额度/限额不足 —— 请在 ElevenLabs 后台调高该 Key 限额或确认余额';
        else msg=dt.message||code||msg;
      }catch(_){ if(r.status===403) msg='朗读代理拒绝（来源不在白名单）'; }
      throw new Error(msg);
    }
    const ct=r.headers.get('Content-Type')||'';
    let url,align=null;
    if(/json/.test(ct)){                          // with-timestamps:JSON {audio_base64, alignment}
      const j=await r.json();
      url='data:audio/mpeg;base64,'+j.audio_base64;
      align=j.alignment||j.normalized_alignment||null;   // 用原始字符（中文显示汉字，非拼音）
    }else{                                         // 兼容旧 Worker:直接音频流
      ttsBlobUrl=url=URL.createObjectURL(await r.blob());
    }
    ttsAudio.pause();ttsAudio.src=url;                          // 复用已解锁的元素（iOS）
    ttsAudio.playbackRate=ttsRate();
    ttsBuildBar(align,text);
    ttsAudio.ontimeupdate=align?ttsTick:null;
    ttsAudio.onended=ttsEnded;                                   // 播完保留：可重播/拖动，不再自动收起
    ttsAudio.play();track('tts');
    const pp=$('#ttsBar .tb-pp');if(pp)pp.textContent='暂停';
    btn.classList.remove('loading');btn.classList.add('playing');btn.querySelector('.lbl').textContent='停止朗读';
  }catch(err){
    ttsStop(false);
    const net=/fetch|network|load failed/i.test(err.message||'');
    alert('朗读失败：'+err.message+(net?'\n（网络问题，请检查连接或代理）':''));
  }
}
/* 中英选中互定位：选中原文中某句/词，只定位并高亮对应译文「那一句」(句子级) */
let crossOrig=[];   // [{el,html}] 用于还原被改写的 div
function clearCross(){
  crossOrig.forEach(o=>{o.el.innerHTML=o.html;});crossOrig=[];
  document.querySelectorAll('.turn.peek').forEach(el=>el.classList.remove('peek'));
}
function sentsOf(t,zh){
  const m=t.match(zh?/[^。！？!?…\n]+[。！？!?…]*/g:/[^.!?。！？\n]+[.!?]*["”’']*\s*/g);
  return (m&&m.length)?m:[t];
}
// 选区端点在 el 内的真实字符偏移（累加 el 内所有文本节点长度，避开 indexOf 的重复词坑）
function offsetInEl(el,container,off){
  const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let n,sum=0;
  while(n=w.nextNode()){if(n===container)return sum+off;sum+=n.nodeValue.length;}
  return sum;
}
// 字符偏移 → 该偏移落在第几句
function sentAt(sents,pos){let a=0,si=0;
  for(let i=0;i<sents.length;i++){si=i;if(pos<a+sents[i].length)break;a+=sents[i].length;}return si;}
/* 句级对照核心：在 turn 内，把 src（mid 字符处）映射到另一语言的对应句并高亮；
   被 syncCross（双语实时）与 peekSel（单语显式按钮）共用 */
function crossMark(turn,srcIsEn,mid){
  const enDiv=turn.querySelector('.en'),zhDiv=turn.querySelector('.zh');
  const src=srcIsEn?enDiv:zhDiv, cp=srcIsEn?zhDiv:enDiv;
  if(!src||!cp)return;
  const srcLen=src.textContent.length||1, cpLen=cp.textContent.length;
  const srcSents=sentsOf(src.textContent,!srcIsEn), cpSents=sentsOf(cp.textContent,srcIsEn);
  // 映射到 cp 句子：句数相同→同序；否则按字符比例落点
  let ci;
  if(srcSents.length===cpSents.length){ci=sentAt(srcSents,mid);}
  else{ci=sentAt(cpSents,(mid/srcLen)*cpLen);}
  ci=Math.max(0,Math.min(cpSents.length-1,ci));
  crossOrig.push({el:cp,html:cp.innerHTML});
  cp.innerHTML=cpSents.map((s,i)=>i===ci?`<span class="xseg">${escHtml(s)}</span>`:escHtml(s)).join('');
  if(getComputedStyle(cp).display==='none')turn.classList.add('peek');   // 单语：就地展开
}
function syncCross(){
  if(_peekHold){_peekHold=false;return;}            // 「看译文」刚点下，别立刻清掉
  const sel=window.getSelection();const selText=(sel?sel.toString():'').trim();
  clearCross();
  if(document.body.dataset.lang!=='both')return;   // 仅双语模式做对照；单语（中/英）下不自动展开（有显式按钮）
  if(!selText||!sel.rangeCount||!sel.anchorNode||!inReader(sel.anchorNode))return;
  const node=sel.anchorNode.nodeType===3?sel.anchorNode.parentElement:sel.anchorNode;
  const turn=node&&node.closest?node.closest('.turn'):null;if(!turn)return;
  const srcIsEn=!!node.closest('.en'),srcIsZh=!!node.closest('.zh');
  if(!srcIsEn&&!srcIsZh)return;
  const src=turn.querySelector(srcIsEn?'.en':'.zh');if(!src)return;
  const rg=sel.getRangeAt(0);
  let a=offsetInEl(src,rg.startContainer,rg.startOffset);
  let b=offsetInEl(src,rg.endContainer,rg.endOffset);
  if(b<a)[a,b]=[b,a];
  const mid=Math.min((src.textContent.length||1)-1,Math.max(0,(a+b)/2));
  crossMark(turn,srcIsEn,mid);
}
/* ====== 问答：问这期（grounded 单期）/ 问全站（RAG-lite 跨期），流式输出 ====== */
const CHAT_PROXY='https://ask.jasonlin.tech';
const CHAT={};   // key('__all__' 或 epId)-> [{role,content}](内存态，导航后重置)
let chatMode='episode', chatEpId=null;
const ALL_SUGG=['不同的人怎么看 AGI 的时间表？','开源还是闭源，大家怎么站队？','关于 AI 安全/对齐有哪些不同观点？','规模化（scaling）还能走多远？'];
const escH=s=>(''+s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const chatKey=()=>chatMode==='all'?'__all__':chatEpId;
function chatSuggHtml(e){
  const qs=chatMode==='all'?ALL_SUGG:((e&&e.brief&&e.brief.qs||[]).map(x=>x.zh||x.en));
  return qs.map(q=>`<button class="chat-sugg" onclick="askEp(this.textContent)">${q}</button>`).join('');
}
// 轻量 Markdown → HTML(无依赖):代码块/行内码/标题/列表/引用/分割线/加粗斜体/链接。
// 先转义 HTML，再结构化；引用记号 [#n]/[@id] 不是 [text](url) 链接，原样保留给 citeHtml 处理。
function mdHtml(src){
  const blocks=[];let s=escH(src||'');
  s=s.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g,(_,c)=>{blocks.push('<pre class="cpre"><code>'+c.replace(/\n$/,'')+'</code></pre>');return '\u0000'+(blocks.length-1)+'\u0000';});
  s=s.replace(/`([^`\n]+)`/g,(_,c)=>{blocks.push('<code class="cinl">'+c+'</code>');return '\u0000'+(blocks.length-1)+'\u0000';});
  const lines=s.split('\n'),out=[];let list=null;
  const closeL=()=>{if(list){out.push('</'+list+'>');list=null;}};
  for(const line of lines){let m;
    if(/^\u0000\d+\u0000$/.test(line)){closeL();out.push(line);continue;}
    if(/^\s*$/.test(line)){closeL();continue;}
    if(m=line.match(/^\s{0,3}(#{1,4})\s+(.*)$/)){closeL();out.push('<div class="cmh cmh'+m[1].length+'">'+m[2]+'</div>');continue;}
    if(/^\s{0,3}([-*_])\1{2,}\s*$/.test(line)){closeL();out.push('<hr class="cmhr">');continue;}
    if(m=line.match(/^\s{0,3}&gt;\s?(.*)$/)){closeL();out.push('<blockquote class="cmq">'+m[1]+'</blockquote>');continue;}
    if(m=line.match(/^\s*[-*+]\s+(.*)$/)){if(list!=='ul'){closeL();out.push('<ul class="cml">');list='ul';}out.push('<li>'+m[1]+'</li>');continue;}
    if(m=line.match(/^\s*\d+[.)]\s+(.*)$/)){if(list!=='ol'){closeL();out.push('<ol class="cml">');list='ol';}out.push('<li>'+m[1]+'</li>');continue;}
    closeL();out.push('<p class="cmp">'+line+'</p>');}
  closeL();s=out.join('');
  s=s.replace(/\*\*([^\n]+?)\*\*/g,'<strong>$1</strong>')
     .replace(/(^|[^*\w])\*([^*\n]+?)\*(?!\w)/g,'$1<em>$2</em>')
     .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,'<a href="$2" target="_blank" rel="nofollow noopener">$1</a>');
  return s.replace(/\u0000(\d+)\u0000/g,(_,i)=>blocks[+i]);
}
function citeHtml(text){
  return mdHtml(text)
    .replace(/\[#(\d+)\]/g,(_,n)=>{const i=+n,ts=TS_CACHE[chatEpId]||[];const title=ts[i]?(''+ts[i].sec).replace(/"/g,''):'第'+(i+1)+'节';
      return `<button class="cite" onclick="jumpSec(${i})" title="${title}">${i+1}</button>`;})
    .replace(/\[@([a-z0-9-]+)\]/gi,(_,id)=>{const e=EPISODES.find(x=>x.id===id);if(!e)return '';const p=PEOPLE[e.pid];
      return `<button class="cite cite-ep" onclick="go('#/episode/${id}')" title="${(e.tZh||e.tEn).replace(/"/g,'')}">${p?p.zh:id}</button>`;});
}
function renderThread(key){
  return (CHAT[key]||[]).map(m=>m.role==='user'
    ? `<div class="cmsg cu">${escH(m.content)}</div>`
    : `<div class="cmsg ca">${(!m.content||m.content==='…')?'<span class="cdots">思考中…</span>':citeHtml(m.content)}</div>`).join('');
}
function setChatMode(m){
  chatMode=m;
  document.querySelectorAll('#chatModeSeg button').forEach(b=>b.classList.toggle('on',b.dataset.m===m));
  const t=$('#chatThread');if(t)t.innerHTML=renderThread(chatKey());
  const s=$('#chatSugg');if(s)s.innerHTML=chatSuggHtml(EPISODES.find(x=>x.id===chatEpId));
  const inp=$('#chatInput');if(inp)inp.placeholder=m==='all'?'问关于全站任何 AI 人物/议题…':'问关于本期的任何问题…';
  const nt=$('#chatNote');if(nt)nt.textContent=(m==='all'?'综合全站要点，必要时自动联网':'优先本期内容，必要时自动联网')+' · AI 生成可能有误，出处可点核对';
}
async function askEp(preset){
  const inp=$('#chatInput');const q=(preset||(inp?inp.value:'')||'').trim();if(!q)return;
  const key=chatKey();if(!key)return;track(chatMode==='all'?'ask_all':'ask');CHAT[key]=CHAT[key]||[];
  const hist=CHAT[key].filter(m=>m.content&&m.content!=='…').slice(-4).map(m=>({role:m.role,content:m.content}));
  CHAT[key].push({role:'user',content:q},{role:'assistant',content:'…'});
  if(inp)inp.value='';
  const ai=CHAT[key].length-1;
  const refresh=()=>{const t=$('#chatThread');if(t){t.innerHTML=renderThread(key);t.scrollTop=t.scrollHeight;}};
  refresh();
  try{
    const payload={mode:chatMode,question:q.slice(0,500),history:hist};
    if(chatMode==='episode')payload.id=chatEpId;
    const r=await fetch(CHAT_PROXY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(!r.ok||!r.body){let msg=r.status;try{msg=(await r.json()).error||msg}catch(_){}CHAT[key][ai]={role:'assistant',content:'（出错：'+msg+'）'};refresh();return;}
    const reader=r.body.getReader(),dec=new TextDecoder();let acc='';CHAT[key][ai].content='';
    for(;;){const {done,value}=await reader.read();if(done)break;acc+=dec.decode(value,{stream:true});CHAT[key][ai].content=acc;refresh();}
    if(!acc){CHAT[key][ai].content='（没有返回内容）';refresh();}
  }catch(e){CHAT[key][ai]={role:'assistant',content:'（网络错误，请重试）'};refresh();}
}
// 宽屏（≥1400px）把 Ask 面板移到右侧 sticky 侧栏，窄屏留在正文内平铺（同一节点，保留会话）
const askMQ=window.matchMedia('(min-width:1400px)');
function placeAsk(){
  const chat=document.querySelector('.chat');if(!chat)return;
  const desk=$('#askDesk'),inline=$('#askInline');
  if(askMQ.matches){if(desk&&chat.parentElement!==desk)desk.appendChild(chat);}
  else{if(inline&&chat.parentElement!==inline)inline.appendChild(chat);}
}
askMQ.addEventListener?askMQ.addEventListener('change',placeAsk):askMQ.addListener(placeAsk);
function askSel(){
  const btn=$('#ttsBtn');const t=((btn&&btn.dataset.text)||'').trim();if(!t)return;
  const bar=$('#selBar');if(bar)bar.style.display='none';
  try{const sel=window.getSelection();sel&&sel.removeAllRanges&&sel.removeAllRanges();}catch(_){}
  if(chatMode!=='episode')setChatMode('episode');
  const chat=document.querySelector('.chat');if(chat&&chat.scrollIntoView)chat.scrollIntoView({behavior:'smooth',block:'center'});
  askEp('请解释这段话：“'+(t.length>140?t.slice(0,140)+'…':t)+'”');
}

/* 点空白处清掉文字选区。浏览器原生并不总会清(移动端 Safari 尤其明显),会出现
   「选中的蓝底一直留在那儿」的残留(2026-08-15 用户报)。ttsCheckSel 只隐藏了工具条,
   没动选区本身,所以之前修不掉。
   排除 #selBar —— 上面的「朗读/标记/分享/看译文」按钮都要用当前选区,先清就没得用了;
   排除 .hl —— 那是已有标记,点它是要移除标记。 */
document.addEventListener('pointerdown',e=>{
  const t=e.target;
  if(t&&t.closest&&(t.closest('#selBar')||t.closest('.hl')))return;
  const s=window.getSelection();
  if(!s||s.isCollapsed)return;
  if(typeof hlHideSel==='function')hlHideSel();
  else{try{s.removeAllRanges();}catch(_){}}
},true);

function ttsInit(){
  const h=()=>setTimeout(()=>{ttsCheckSel();syncCross();},10);
  document.addEventListener('mouseup',h);
  document.addEventListener('touchend',h);
}

/* ============================ CONTROLS ============================ */
function setSize(s){keepAnchor(()=>{document.body.dataset.size=s;});syncSeg();localStorage.size=s;localStorage.prefsT=Date.now();syncTouch();}
function setLang(l){keepAnchor(()=>{document.body.dataset.lang=l;});syncSeg();localStorage.lang=l;localStorage.prefsT=Date.now();syncTouch();}
function toggleOrder(){keepAnchor(()=>{const o=document.body.dataset.order==='zh'?'en':'zh';document.body.dataset.order=o;localStorage.order=o;});syncSeg();localStorage.prefsT=Date.now();syncTouch();}
function syncSeg(){
  const sz=document.body.dataset.size,lg=document.body.dataset.lang;
  const m={s:0,m:1,l:2};
  const ss=$('#sizeSeg'),ls=$('#langSeg'),ob=$('#orderBtn');
  if(ss)[...ss.children].forEach((b,i)=>b.classList.toggle('on',i===m[sz]));
  if(ls){const lm={en:0,zh:1,both:2};[...ls.children].forEach((b,i)=>b.classList.toggle('on',i===lm[lg]));}
  if(ob)ob.querySelector('.ol').textContent=document.body.dataset.order==='zh'?'译文在前':'原文在前';
}
function toggleTheme(){const t=document.documentElement.dataset.theme==='dark'?'light':'dark';
  document.documentElement.dataset.theme=t;localStorage.theme=t;localStorage.prefsT=Date.now();syncTouch();}
function toggleSearch(){$('#searchOverlay').classList.contains('on')?closeSearch():openSearch();}
function openSearch(){const o=$('#searchOverlay');o.classList.add('on');ensureExtra();searchInput('');
  setTimeout(()=>$('#searchInput').focus(),40);}
function closeSearch(){const o=$('#searchOverlay');o.classList.remove('on');$('#searchInput').value='';}
function srPerson(id){const p=PEOPLE[id];return `<div class="sr-row" data-go="#/person/${id}" onclick="srPick('#/person/${id}')">
  ${av(id)}<div class="sr-meta"><div class="sr-t">${p.en} · ${p.zh}</div>
  <div class="sr-s">${p.tiZh} · ${epsOf(id).length} 期播客</div></div></div>`;}
function srEp(e,snip){const p=PEOPLE[e.pid];return `<div class="sr-row" data-go="#/episode/${e.id}" onclick="srPick('#/episode/${e.id}')">
  <div class="sr-ic" style="background:${FIELDS[e.fields[0]].c}"></div>
  <div class="sr-meta"><div class="sr-t">${e.tEn}</div>
  <div class="sr-s">${p.zh} · ${e.pod.zh} · ${fmtDate(e.date)}</div>
  ${snip?`<div class="sr-snip">${snip}</div>`:''}</div></div>`;}
function srTopic(d){return `<div class="sr-row" data-go="#/topic/${d.slug}" onclick="srPick('#/topic/${d.slug}')">
  <div class="sr-ic" style="background:var(--accent)"></div>
  <div class="sr-meta"><div class="sr-t">${d.zh} · ${d.en}</div>
  <div class="sr-s">议题 · ${topicStat(d.slug).n} 条跨人物观点</div></div></div>`;}
function srMark(m){return `<div class="sr-row" data-mk="${m.id}|${m.it.sec}|${m.idx}" onclick="srPickMark('${m.id}',${m.it.sec},${m.idx})">
  <div class="sr-ic" style="background:var(--accent)"></div>
  <div class="sr-meta"><div class="sr-t">${(m.it.text||'').replace(/</g,'&lt;')}</div>
  <div class="sr-s">我的标记 · ${PEOPLE[m.e.pid]?PEOPLE[m.e.pid].zh:''} · ${m.e.tZh}</div></div></div>`;}
function srPickMark(id,sec,idx){closeSearch();hlJump(id,sec,idx);}
function srPick(h){closeSearch();go(h);}
function searchInput(q){
  const k=q.trim().toLowerCase(),res=$('#searchResults');
  if(!k){res.innerHTML=`<div class="sr-group">全部人物 · ${Object.keys(PEOPLE).length}</div>`+
    Object.keys(PEOPLE).map(srPerson).join('');srSel(0);return;}
  const fstr=fs=>fs.map(f=>FIELDS[f]?FIELDS[f].en+FIELDS[f].zh:'').join('');
  const toks=k.split(/\s+/).filter(Boolean);
  const hasAll=hay=>toks.every(t=>hay.includes(t));
  const tps=(typeof TOPICS!=='undefined'?TOPICS.defs:[]).filter(d=>hasAll((d.zh+d.en+d.slug).toLowerCase()));
  const ppl=Object.keys(PEOPLE).filter(id=>{const p=PEOPLE[id];
    return hasAll((p.en+p.zh+p.tiEn+p.tiZh+fstr(p.fields)).toLowerCase());});
  // 单集：标题/导语/媒体/领域/人物名（多词 AND）；否则深入核心观点/反共识,命中作摘要
  const eps=EPISODES.map(e=>{
    const pe=PEOPLE[e.pid]||{};
    const meta=(e.tEn+e.tZh+e.sEn+e.sZh+e.pod.en+e.pod.zh+(pe.en||'')+(pe.zh||'')+fstr(e.fields)).toLowerCase();
    const ins=e.insights||{};const pts=[...(ins.consensus||[]),...(ins.contrarian||[])];
    if(hasAll(meta))return{e,snip:''};
    const hit=pts.find(x=>hasAll(meta+((x.en||'')+(x.zh||'')).toLowerCase()));
    return hit?{e,snip:'“'+(hit.zh||hit.en)+'”'}:null;
  }).filter(Boolean);
  const marks=[];const hm=hlGet();
  for(const id in hm){const e=EPISODES.find(x=>x.id===id);if(!e)continue;
    (hm[id]||[]).forEach((it,idx)=>{if((it.text||'').toLowerCase().includes(k))marks.push({id,idx,it,e});});}
  marks.sort((a,b)=>(b.it.ts||0)-(a.it.ts||0));
  let html='';
  if(marks.length)html+=`<div class="sr-group">我的标记 · ${marks.length}</div>`+marks.map(srMark).join('');
  if(tps.length)html+=`<div class="sr-group">议题 · ${tps.length}</div>`+tps.map(srTopic).join('');
  if(ppl.length)html+=`<div class="sr-group">人物 · ${ppl.length}</div>`+ppl.map(srPerson).join('');
  if(eps.length)html+=`<div class="sr-group">播客 · ${eps.length}（含核心观点匹配）</div>`+eps.map(x=>srEp(x.e,x.snip)).join('');
  res.innerHTML=html||`<div class="sr-empty">没有匹配 “${q}”</div>`;srSel(0);
}
function srSel(i){const rows=[...document.querySelectorAll('#searchResults .sr-row')];
  rows.forEach((r,j)=>r.classList.toggle('sel',i===j));}
function searchKey(e){
  const rows=[...document.querySelectorAll('#searchResults .sr-row')];
  let i=rows.findIndex(r=>r.classList.contains('sel'));
  if(e.key==='Escape'){closeSearch();}
  else if(e.key==='ArrowDown'){e.preventDefault();srSel(Math.min(rows.length-1,i+1));{const _r=rows[Math.min(rows.length-1,i+1)];if(_r)_r.scrollIntoView({block:'nearest'});}}
  else if(e.key==='ArrowUp'){e.preventDefault();srSel(Math.max(0,i-1));{const _r=rows[Math.max(0,i-1)];if(_r)_r.scrollIntoView({block:'nearest'});}}
  else if(e.key==='Enter'){const r=rows[i<0?0:i];if(r){if(r.dataset.mk){const m=r.dataset.mk.split('|');srPickMark(m[0],+m[1],+m[2]);}else srPick(r.dataset.go);}}
}

/* ============================ ROUTER ============================ */
let _nav=0;
function go(h){_nav++;location.hash=h;}
function goBack(pid){if(_nav>0)history.back();else go(pid?'#/person/'+pid:'#/');}
/* 盘古之白：中文与英文/数字之间自动补空格（渲染时处理文本节点，纯英文节点不受影响） */
const CJK='\\u4e00-\\u9fff\\u3040-\\u30ff\\u3400-\\u4dbf';
const RE1=new RegExp('(['+CJK+'])([A-Za-z0-9%])','g');
const RE2=new RegExp('([A-Za-z0-9%\\)\\]])(['+CJK+'])','g');
/* 中文标点规范：CJK 相邻的半角标点转全角（并吸收多余空格）;仅对含 CJK 的文本节点生效 */
const FW={',':'，',';':'；','!':'！','?':'？',':':'：'};
const RE_PUNC=new RegExp('(['+CJK+'])[ \\t]*([,;!?:])[ \\t]*','g');
const RE_OP=new RegExp('\\([ \\t]*(['+CJK+'])','g');
const RE_CP=new RegExp('(['+CJK+'])[ \\t]*\\)','g');
function pangu(t){
  t=t.replace(RE_PUNC,(_,c,p)=>c+FW[p]).replace(RE_OP,'（$1').replace(RE_CP,'$1）');
  return t.replace(RE1,'$1 $2').replace(RE2,'$1 $2');
}
function pangufy(root){
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];let n;
  while(n=w.nextNode())nodes.push(n);
  const cjk=/[一-鿿]/;
  nodes.forEach(nd=>{const v=nd.nodeValue;if(v&&cjk.test(v)){const nv=pangu(v);if(nv!==v)nd.nodeValue=nv;}});
}
/* ====== 多设备同步（无账号：同步码即身份；匿名随机码，零 PII） ====== */
const SYNC_URLS=['https://sync.jasonlin.tech','https://aipodcast-sync.992978142.workers.dev'];
async function syncFetch(path,opts){let last;
  for(const u of SYNC_URLS){try{const r=await fetch(u+path,opts);if(r.status<500)return r;last=r;}catch(e){last=e;}}
  throw last instanceof Error?last:new Error('sync unreachable');}
const syncCode=()=>localStorage.syncCode||'';
// 统计去重用:同步码的哈希(前 8 字节)。发给统计的是哈希、绝非原始码(原始码=读写凭证)。缓存于 localStorage 供埋点同步取用。
let _sid=(localStorage.syncSidFor&&localStorage.syncSidFor===localStorage.syncCode?localStorage.syncSid:'')||'';
async function syncSid(){
  const c=syncCode();if(!c){_sid='';return;}
  if(localStorage.syncSidFor===c&&localStorage.syncSid){_sid=localStorage.syncSid;return;}
  try{const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('uv|'+c));
    _sid=[...new Uint8Array(buf)].slice(0,8).map(x=>x.toString(16).padStart(2,'0')).join('');
    localStorage.syncSid=_sid;localStorage.syncSidFor=c;}catch(_){_sid='';}
}
syncSid();
function syncGen(){const a='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';const b=new Uint8Array(20);crypto.getRandomValues(b);return[...b].map(x=>a[x%32]).join('');}
function syncCollect(){return{
  read:[...readGet()],later:laterGet(),pos:readPosGet(),recent:recentGet(),recentT:recentTGet(),hl:hlGet(),rlog:rlogGet(),
  prefs:{size:localStorage.size||'',lang:localStorage.lang||'',order:localStorage.order||'',theme:localStorage.theme||'',t:+localStorage.prefsT||0},
  t:Date.now()};}
function syncMerge(r){
  if(!r||typeof r!=='object')return false;
  let changed=false;
  const readS=new Set([...readGet()]);const rb=readS.size;(r.read||[]).forEach(x=>readS.add(x));
  if(readS.size!==rb){localStorage.readEpisodes=JSON.stringify([...readS]);changed=true;}
  const laterS=new Set(laterGet());const lb=laterS.size;(r.later||[]).forEach(x=>laterS.add(x));
  const laterArr=[...laterS].filter(x=>!readS.has(x));   // 已读的自动移出待读
  if(laterArr.length!==lb){localStorage.laterEpisodes=JSON.stringify(laterArr);changed=true;}
  const lp=readPosGet(),rp=r.pos||{};let posChanged=false;
  for(const id in rp){const a=lp[id],b=rp[id];
    if(b&&typeof b.s==='number'&&(!a||(b.t||0)>(a.t||0))){lp[id]=b;posChanged=true;}}
  if(posChanged){try{localStorage.readPos=JSON.stringify(lp)}catch(_){}changed=true;}
  {const rl=r.rlog;if(rl&&typeof rl==='object'){const g=rlogGet();let ch=false;
    Object.keys(rl).forEach(k=>{const v=+rl[k]||0;if(v>(g[k]||0)){g[k]=v;ch=true;}});
    if(ch){localStorage.readLog=JSON.stringify(g);changed=true;}}}
  const pf=r.prefs||{};
  if((pf.t||0)>(+localStorage.prefsT||0)){
    ['size','lang','order','theme'].forEach(k=>{if(pf[k])localStorage[k]=pf[k];});
    localStorage.prefsT=pf.t;changed=true;
    if(pf.theme)document.documentElement.dataset.theme=pf.theme;
    ['size','lang','order'].forEach(k=>{if(pf[k])document.body.dataset[k]=pf[k];});
  }
  // 「上次看到」合并:两端 recent ∪ 时间戳(缺失回退阅读位置 t),按新→旧取 6
  {
    const lt=recentTGet(),rt=r.recentT||{};
    const tOf=id=>Math.max(lt[id]||0,rt[id]||0,(lp[id]&&lp[id].t)||0);
    const ids=[...new Set([...(recentGet()),...(r.recent||[])])];
    if(ids.length){
      const merged=ids.sort((a,b)=>tOf(b)-tOf(a)).slice(0,12);
      if(JSON.stringify(merged)!==JSON.stringify(recentGet())){
        localStorage.recentEpisodes=JSON.stringify(merged);_recentSnap=localStorage.recentEpisodes;changed=true;}
      const nt={};ids.forEach(id=>{const t=tOf(id);if(t)nt[id]=t;});
      try{localStorage.recentT=JSON.stringify(nt)}catch(_){}
    }
  }
  const rh=r.hl;
  if(rh&&typeof rh==='object'){const lh=hlGet();let hc=false;
    for(const id in rh){const la=lh[id]||[];const seen=new Set(la.map(x=>x.sec+'|'+x.ti+'|'+x.lang+'|'+x.s+'|'+x.e));
      (rh[id]||[]).forEach(x=>{const k=x.sec+'|'+x.ti+'|'+x.lang+'|'+x.s+'|'+x.e;if(!seen.has(k)){la.push(x);seen.add(k);hc=true;}});
      if(la.length)lh[id]=la;}
    if(hc){hlSave(lh);changed=true;}}
  return changed;
}
let _syncTimer=null,_syncBusy=false,_syncLastPull=0;
function syncTouch(){if(!syncCode())return;clearTimeout(_syncTimer);_syncTimer=setTimeout(syncPush,5000);}
let _syncErr='';
async function syncPush(){
  const c=syncCode();if(!c||_syncBusy)return;_syncBusy=true;
  try{const r=await syncFetch('/s/'+c,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(syncCollect())});
    if(!r.ok)throw new Error('HTTP '+r.status);
    localStorage.syncT=Date.now();_syncErr='';}
  catch(e){_syncErr='连不上同步服务器（部分网络屏蔽 workers.dev）';}
  _syncBusy=false;syncPanelRefresh();
}
async function syncPull(){
  const c=syncCode();if(!c)return;_syncLastPull=Date.now();
  try{const r=await syncFetch('/s/'+c,{cache:'no-store'});
    if(r.status===404){await syncPush();return;}
    if(r.ok){const changed=syncMerge(await r.json());localStorage.syncT=Date.now();_syncErr='';
      const onHome=!(location.hash||'#/').slice(2).split('?')[0].split('/').filter(Boolean).length;
      if(changed&&onHome)render();else syncPanelRefresh();
      await syncPush();   // 合并结果回写,双向收敛
    }else throw new Error('HTTP '+r.status);
  }catch(e){_syncErr='连不上同步服务器（部分网络屏蔽 workers.dev）';syncPanelRefresh();}
}
function syncStart(){localStorage.syncCode=syncGen();localStorage.prefsT=localStorage.prefsT||Date.now();syncSid();syncPush();syncPanelRefresh();track('sync');}
async function syncJoin(code){
  code=(code||'').toUpperCase().replace(/[^A-Z2-7]/g,'');
  if(!/^[A-Z2-7]{20}$/.test(code)){alert('同步码应为 20 位字母数字（不含 0/1/8/9）');return false;}
  localStorage.syncCode=code;await syncSid();await syncPull();syncPanelRefresh();return true;
}
function syncJoinInput(){const el=document.getElementById('syncIn');if(el)syncJoin(el.value);}
function syncOff(){localStorage.removeItem('syncCode');localStorage.removeItem('syncT');localStorage.removeItem('syncSid');localStorage.removeItem('syncSidFor');_sid='';syncPanelRefresh();}
function syncCopy(what){
  const c=syncCode();if(!c)return;
  const v=what==='link'?('https://aipodcast.jasonlin.tech/#sync='+c):c.replace(/(.{4})(?=.)/g,'$1-');
  if(navigator.clipboard)navigator.clipboard.writeText(v);
  const b=document.getElementById(what==='link'?'syncCpL':'syncCpC');
  if(b){const t=b.textContent;b.textContent='已复制 ✓';setTimeout(()=>b.textContent=t,1500);}
}
async function syncNow(b){b.textContent='同步中…';await syncPull();b.textContent=_syncErr?'重试':'已同步 ✓';setTimeout(()=>{const x=document.getElementById('syncNowBtn');if(x)x.textContent='立即同步';},2000);}
function syncAgo(){const t=+localStorage.syncT||0;if(!t)return '尚未同步';
  const m=Math.round((Date.now()-t)/60000);return m<1?'刚刚已同步':m<60?`${m} 分钟前同步`:`${Math.round(m/60)} 小时前同步`;}
function syncPanelHtml(){
  const c=syncCode();
  if(!c)return `<b style="color:var(--text-2)">多设备同步</b> — 一个匿名同步码，跨设备同步已读、稍后读与阅读进度。无账号、无 Cookie。同一个码也可在姊妹站 AI Paper 使用。<br>
    <button class="mcp-copy" onclick="syncStart()">开启同步</button>
    <span style="margin:0 6px;color:var(--text-3)">或</span>
    <input id="syncIn" placeholder="输入同步码" style="font-family:var(--ui);font-size:16px;padding:5px 10px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--text);width:220px" onkeydown="if(event.key==='Enter')syncJoinInput()">
    <button class="mcp-copy" onclick="syncJoinInput()">加入</button>`;
  return `<b style="color:var(--text-2)">多设备同步 · 已开启</b> — <span style="color:${_syncErr?'#c0392b':'var(--text-3)'}">${_syncErr||syncAgo()}</span><br>
    同步码 <code class="mcp-url">${c.replace(/(.{4})(?=.)/g,'$1-')}</code>
    <button id="syncCpC" class="mcp-copy" onclick="syncCopy('code')">复制码</button>
    <button id="syncCpL" class="mcp-copy" onclick="syncCopy('link')">复制配对链接</button>
    <button id="syncNowBtn" class="mcp-copy" onclick="syncNow(this)">立即同步</button>
    <button class="mcp-copy" onclick="syncOff()" title="仅本机停用，云端数据保留">关闭</button><br>
    <span class="mcp-tools">另一台设备打开配对链接即完成；码即身份，勿公开分享。</span>`;
}
function syncPanelRefresh(){const el=document.getElementById('syncPanel');if(el)el.innerHTML=syncPanelHtml();}
addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'&&syncCode()&&Date.now()-_syncLastPull>60000)syncPull();
});

/* ====== 更新提醒（浏览器推送）======================================================
   目的:补「读完就走、没有第二天」的缺口 —— 有新内容时主动叫回来一次。

   现实约束(2026-08-13 直连实测):Chrome/Edge/Android 的推送必须经 fcm.googleapis.com,
   国内网络不可达,**连 subscribe() 都会直接失败**;Safari(web.push.apple.com)、
   Firefox、Edge(WNS)可达。所以"开启失败"在这里不是罕见兜底而是主路径之一,
   必须给人话解释 + RSS 备选,绝不能留一个按了没反应的开关。
   iOS 另有一层:Safari 只在「已添加到主屏幕」时才允许网页推送。 */
const PUSH_API='https://push.jasonlin.tech';
const PUSH_SITE='aipodcast';
const VAPID_PUB='BKZpK04qWu3AxxSH9KatKT0882TaRH43G1JhOQ1cLkaEg_AyR8os6JcLpzNhUKvyhmlEpD6no9SHphYbd_-n2hc';
function urlB64ToBytes(s){const p='='.repeat((4-s.length%4)%4);
  const b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));const a=new Uint8Array(b.length);
  for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;}
function pushSupported(){return 'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;}
/* iOS/iPadOS 未加到主屏幕时,PushManager 存在但 subscribe 必失败 */
function pushIOSNeedsInstall(){
  const iOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  return iOS&&!(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)&&!navigator.standalone;}
/* navigator.serviceWorker.ready 在「一个 SW 都没注册」时**永远不 resolve**(不是拒绝,是挂着)。
   隐私模式、SW 注册被拦、或本地直接开文件时都会这样 —— 不加超时的话面板会永远停在"检查中…"。 */
function swReady(ms){
  return Promise.race([navigator.serviceWorker.ready,
    new Promise((_,rj)=>setTimeout(()=>rj(new Error('Service Worker 未就绪')),ms||3000))]);}
let _pushSynced=false;
async function pushState(){
  if(!pushSupported())return 'unsupported';
  if(pushIOSNeedsInstall())return 'ios';
  if(Notification.permission==='denied')return 'denied';
  try{const r=await swReady();const s=await r.pushManager.getSubscription();
    if(!s)return 'off';
    /* 本地有订阅 ≠ 服务器有。上报只要失败过一次,面板就会永远显示"已开启"而服务端空空如也
       —— 2026-08-13 实测就是这么丢的(Safari 面板显示已开启,push_subs 表为空)。
       每次进面板补一次幂等上报(worker 的 /sub 是 upsert),让两边自动收敛。 */
    if(!_pushSynced&&!(await pushReRegister(s)))return 'unsynced';
    return 'on';
  }catch(_){return 'off';}}
/* 把本地订阅补登记到服务器(/sub 是幂等 upsert)。成功返回 true。 */
async function pushReRegister(s){
  try{const rr=await fetch(PUSH_API+'/sub',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({site:PUSH_SITE,sub:s.toJSON()})});
    _pushSynced=rr.ok;return rr.ok;
  }catch(_){return false;}}
/* 每次访问都静默自愈一次。**不能只在「我的」页做** —— 面板只在那一页渲染,
   而用户多数时候根本不去那儿(2026-08-13:订阅丢了,让 Jason 刷新,他刷的是首页和
   人物页,自愈代码压根没跑)。放在 load 后延迟执行,不抢首屏。 */
async function pushSyncQuiet(){
  if(!pushSupported()||_pushSynced)return;
  try{
    if(Notification.permission!=='granted')return;
    const r=await swReady(8000);const s=await r.pushManager.getSubscription();
    if(s)await pushReRegister(s);
  }catch(_){}}
addEventListener('load',()=>setTimeout(pushSyncQuiet,2500));
let _pushNote='';
const RSS_TIP='<a href="https://feed.jasonlin.tech/aipodcast.xml" style="color:var(--accent)">订阅 RSS</a>（任何网络都能用）';
function pushPanelHtml(){setTimeout(pushPanelRefresh,0);
  return `<div class="st-h3">更新提醒</div><div id="pushPanel"><div class="st-empty">检查中…</div></div>`;}
async function pushPanelRefresh(){
  const el=document.getElementById('pushPanel');if(!el)return;
  const st=await pushState();
  const note=_pushNote?`<div class="st-empty" style="margin-top:10px">${_pushNote}</div>`:'';
  const btn=(txt,fn)=>`<button class="shp-btn" style="margin-top:12px;width:auto;padding:9px 20px" id="pushBtn" onclick="${fn}">${txt}</button>`;
  if(st==='unsupported')el.innerHTML=`<div class="st-empty">这个浏览器不支持网页推送。${RSS_TIP}</div>`;
  else if(st==='ios')el.innerHTML=`<div class="st-empty">iPhone / iPad 上，需要先用 Safari 的「分享 → 添加到主屏幕」把本站装成图标，才能开启推送。或者${RSS_TIP}。</div>`;
  else if(st==='denied')el.innerHTML=`<div class="st-empty">本站的通知权限被浏览器屏蔽了，需要在地址栏的站点设置里恢复。或者${RSS_TIP}。</div>`;
  else if(st==='unsynced')el.innerHTML=`<div class="st-empty">浏览器这边已订阅，但没能登记到提醒服务器（多半是网络问题），所以还收不到。点下面重试。</div>${btn('重试登记','pushSubscribe()')}${note}`;
  else if(st==='on')el.innerHTML=`<div class="st-empty">已开启 ✓ 有新一期时会收到一条通知（多期会合并成一条）。</div>${btn('关闭提醒','pushUnsubscribe()')}${note}`;
  else el.innerHTML=`<div class="st-empty">有新访谈时给你发一条浏览器通知。不需要账号，也不收集任何个人信息。</div>${btn('开启更新提醒','pushSubscribe()')}${note}`;}
function pushDiagnose(e){
  const m=''+((e&&e.message)||e);
  const safari=/Safari/.test(navigator.userAgent)&&!/Chrome|Chromium|Edg|CriOS|FxiOS/.test(navigator.userAgent);
  if(Notification.permission==='denied')
    return '浏览器里选择了不允许通知。Safari 可在「设置 → 网站 → 通知」改回允许；Chrome 点地址栏左侧图标改。或'+RSS_TIP+'。';
  if(safari)   // Safari 的失败多是"手势已失效",别拿 FCM 那套解释误导
    return '开启失败：'+m.slice(0,110)+'。Safari 要求授权后立刻订阅，再点一次通常就成；或'+RSS_TIP+'。';
  if(/push service|AbortError|Registration failed|applicationServerKey/i.test(m))
    return '开启失败：浏览器连不上它自己的推送服务器。Chrome / Edge 的推送要经 Google FCM，国内网络通常不通 —— 可以改用 Safari，或'+RSS_TIP+'。';
  return '开启失败：'+m.slice(0,140)+'。可以先'+RSS_TIP+'。';}
async function pushSubscribe(){
  const b=document.getElementById('pushBtn');if(b){b.disabled=true;b.textContent='正在开启…';}
  _pushNote='';let sub=null;
  try{
    const reg=await swReady(5000);
    /* 直接 subscribe —— 它自己会弹权限请求。先 await Notification.requestPermission() 再
       subscribe,Safari 会认为已脱离用户手势而抛 NotAllowedError(Safari 的经典坑)。*/
    sub=await reg.pushManager.getSubscription()
        ||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlB64ToBytes(VAPID_PUB)});
    const r=await fetch(PUSH_API+'/sub',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({site:PUSH_SITE,sub:sub.toJSON()})});
    if(!r.ok)throw new Error('订阅服务器未接受（HTTP '+r.status+'）');
    _pushSynced=true;
    const act=reg.active||navigator.serviceWorker.controller;   // 刚注册时 reg.active 可能还是 null
    if(act)act.postMessage({type:'push-seen-init',ts:Date.now()});
  }catch(e){
    _pushNote=pushDiagnose(e);
    // 服务器没收下就别留着本地订阅,否则面板会一直谎称"已开启"
    if(sub&&!_pushSynced){try{await sub.unsubscribe();}catch(_){}}
  }
  pushPanelRefresh();}
async function pushUnsubscribe(){
  const b=document.getElementById('pushBtn');if(b){b.disabled=true;b.textContent='正在关闭…';}
  _pushNote='';
  try{const reg=await swReady(5000);const s=await reg.pushManager.getSubscription();
    if(s){await fetch(PUSH_API+'/unsub',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({endpoint:s.endpoint})}).catch(()=>{});await s.unsubscribe();}
  }catch(e){_pushNote='关闭时出错：'+(''+((e&&e.message)||e)).slice(0,100);}
  pushPanelRefresh();}


/* ====== 更新提醒的「软提示」==========================================================
   为什么不在页面刷新时直接弹浏览器授权框:
   ① Safari 与 Firefox **要求用户手势**,页面加载时自动调 requestPermission()/subscribe()
      会直接失败 —— 而 Safari 恰恰是国内唯一真收得到推送的浏览器;
   ② Chrome 虽然允许,但对"一进站就弹"会降权成静默 UI;
   ③ 最要紧:浏览器授权**只有一次机会**,被拒过就再也弹不出来,等于永久失去这个人。
   所以先在站内问一次(这一步不消耗那次机会),用户点「开启」那一下正好是手势,
   再去调浏览器授权框。这也是转化率最高的做法 —— 埋在「我的」页里基本等于没有。

   打扰控制:只对**已经读过内容**的人问(明确兴趣信号),或在详情页停留够久才问;
   关掉一次隔 14 天再问,累计关两次就永不再问。 */
const NUDGE_GAP=14*864e5, NUDGE_MAX=2, NUDGE_DWELL=45000;
function pushNudgeHide(){const c=document.getElementById('pushNudge');
  if(c){c.classList.remove('on');setTimeout(()=>c.remove(),260);}}
function pushNudgeDismiss(){
  localStorage.pushNudgeTs=Date.now();
  localStorage.pushNudgeN=(+localStorage.pushNudgeN||0)+1;
  pushNudgeHide();}
async function pushNudgeAccept(){
  const c=document.getElementById('pushNudge');const b=c&&c.querySelector('.pn-b');
  if(b){b.disabled=true;b.textContent='正在开启…';}
  await pushSubscribe();
  if(!c||!document.body.contains(c))return;
  if(_pushSynced){
    c.querySelector('.pn-t').textContent='已开启 ✓';
    c.querySelector('.pn-s').textContent='有新一期时会收到一条通知。';
    c.querySelector('.pn-btns').innerHTML='';
    setTimeout(pushNudgeHide,2400);
  }else{
    c.querySelector('.pn-s').innerHTML=_pushNote||'开启失败，可以稍后在「我的」页再试。';
    if(b){b.disabled=false;b.textContent='重试';}
  }}
function pushNudgeShow(){
  if(document.getElementById('pushNudge'))return;
  if(!document.getElementById('pnStyle')){
    const st=document.createElement('style');st.id='pnStyle';
    st.textContent=`.pn{position:fixed;z-index:80;left:16px;right:16px;bottom:16px;margin:0 auto;max-width:390px;
      display:flex;gap:12px;align-items:flex-start;padding:16px 16px 14px;border-radius:16px;
      background:var(--surface-2,var(--surface,#fff));border:1px solid var(--line,rgba(0,0,0,.1));
      box-shadow:0 10px 34px rgba(0,0,0,.16);opacity:0;transform:translateY(14px);
      transition:opacity .24s ease,transform .24s ease}
    .pn.on{opacity:1;transform:none}
    .pn-ic{flex:0 0 auto;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;
      background:var(--accent,var(--acc,#0a84ff));color:#fff}
    .pn-ic svg{width:16px;height:16px;display:block}
    .pn-tx{flex:1;min-width:0}
    .pn-t{font-size:15px;font-weight:600;color:var(--text,#111);letter-spacing:-.01em}
    .pn-s{margin-top:4px;font-size:13px;line-height:1.5;color:var(--text-2,var(--sub,#666))}
    .pn-btns{display:flex;gap:8px;margin-top:12px;justify-content:flex-end;width:100%}
    .pn-x,.pn-b{font:inherit;font-size:13px;border-radius:9px;padding:7px 14px;cursor:pointer;border:1px solid transparent}
    .pn-x{background:none;color:var(--text-2,var(--sub,#666))}
    .pn-x:hover{background:var(--surface,rgba(0,0,0,.05))}
    .pn-b{background:var(--accent,var(--acc,#0a84ff));color:#fff;font-weight:600}
    .pn-b:disabled{opacity:.6;cursor:default}
    @media(min-width:720px){.pn{left:auto;right:22px;bottom:22px;margin:0}}`;
    document.head.appendChild(st);}
  const d=document.createElement('div');d.id='pushNudge';d.className='pn';
  d.innerHTML=`<div class="pn-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg></div>
    <div class="pn-tx"><div class="pn-t">有新一期访谈时提醒你？</div><div class="pn-s">有新内容时发一条浏览器通知，不需要账号，随时可关。</div>
    <div class="pn-btns"><button class="pn-x" type="button" onclick="pushNudgeDismiss()">以后再说</button>
    <button class="pn-b" type="button" onclick="pushNudgeAccept()">开启提醒</button></div></div>`;
  document.body.appendChild(d);
  requestAnimationFrame(()=>d.classList.add('on'));}
let _nudgeTimer=null;
async function pushNudgeTick(){
  if(document.getElementById('pushNudge'))return;
  if(!pushSupported()||pushIOSNeedsInstall())return;
  if(Notification.permission==='denied')return;
  if((+localStorage.pushNudgeN||0)>=NUDGE_MAX)return;
  const t=+localStorage.pushNudgeTs||0; if(t&&Date.now()-t<NUDGE_GAP)return;
  try{const r=await swReady(6000);if(await r.pushManager.getSubscription())return;}catch(_){}
  if(readGet().size>=1){pushNudgeShow();return;}      // 读过东西 = 有兴趣,直接问
  clearTimeout(_nudgeTimer);                           // 否则在详情页读满一会儿再问
  if(/^#\/episode\//.test(location.hash))
    _nudgeTimer=setTimeout(pushNudgeTick,NUDGE_DWELL);}
addEventListener('load',()=>setTimeout(pushNudgeTick,2000));
addEventListener('hashchange',()=>setTimeout(pushNudgeTick,300));

/* ====== 匿名访问统计（无 Cookie / 不收集个人信息；数据进自有 D1，可在 Claude Code 直接查） ====== */
const STATS_URL='https://stats.jasonlin.tech';
const _dev=/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)?'mobile':'desktop';
const _ref=(()=>{try{return document.referrer?new URL(document.referrer).host:'';}catch(_){return '';}})();
let _lastView=null;
/* 匿名访客 ID(2026-08-09 加):此前 UV 只有服务端的「每日哈希」vid = SHA256(盐+当天日期+IP+UA),
   日期在哈希输入里 → 同一人隔天必然换 ID,**跨天/跨周留存在结构上不可测**(190 人里"只有 1 人回访",
   那 1 人恰恰是唯一设了同步码因而能被认出来的 Jason 本人,不是唯一回来过的人)。
   这里在 localStorage 存一个纯随机匿名 ID 随埋点上报,worker 优先用它。
   隐私口径不降反升:随机数与任何个人信息无关,比 IP 哈希更保守;清缓存/换浏览器会重新计人(所有前端埋点通病)。*/
const _aid=(()=>{try{let a=localStorage.aid;
  if(!a){a=([...crypto.getRandomValues(new Uint8Array(10))].map(x=>x.toString(16).padStart(2,'0')).join(''));localStorage.aid=a;}
  return a;}catch(_){return '';}})();
function track(type,path){
  try{const p=path||(location.hash.replace(/^#/,'').split('?')[0]||'/');
    const body=JSON.stringify({type,path:p,ua:_dev,ref:_ref,sid:_sid||'',aid:_aid});
    if(navigator.sendBeacon)navigator.sendBeacon(STATS_URL,new Blob([body],{type:'text/plain'}));  // text/plain 才能免预检跨域发出
    else fetch(STATS_URL,{method:'POST',headers:{'Content-Type':'text/plain'},body,keepalive:true});
  }catch(_){}}
function trackView(){const p=location.hash.replace(/^#/,'').split('?')[0]||'/';if(p===_lastView)return;_lastView=p;track('view',p);}
function render(){
  if(typeof ttsStop==='function')ttsStop(true);   // 切页时停朗读、收起跟读条
  // 配对深链:#sync=<码> → 保存并拉取合并
  if(location.hash.startsWith('#sync=')){
    const code=location.hash.slice(6);
    history.replaceState(null,'','#/');
    syncJoin(code).then(ok=>{if(ok)setTimeout(()=>alert('配对成功，阅读记录已同步 ✓'),300);});
  }
  const h=location.hash||'#/';
  const[path,query]=h.slice(2).split('?');
  const parts=path.split('/').filter(Boolean);
  let html;
  if(query){const qp=new URLSearchParams(query);
    if(qp.get('field')){bf={person:'',org:'',year:'',pod:'',field:qp.get('field'),read:''};
      if(parts[0]==='browse')history.replaceState(null,'','#/browse');}   // 应用一次即剥离,避免每次 render 重置筛选
    if(qp.get('org')){bf={person:'',org:qp.get('org'),year:'',pod:'',field:'',read:''};
      if(parts[0]==='browse')history.replaceState(null,'','#/browse');}
    if(parts[0]==='episode'&&(qp.get('at')!=null||qp.get('hl')))pendingLocate={id:parts[1],at:qp.get('at'),hl:qp.get('hl')};}
  if(!parts.length)html=vHome();
  else if(parts[0]==='people')html=vPeople();
  else if(parts[0]==='ask')html=vAsk();
  else if(parts[0]==='topics')html=vTopics();
  else if(parts[0]==='topic')html=vTopic(parts[1]);
  else if(parts[0]==='fields')html=vFields();
  else if(parts[0]==='browse')html=vBrowse();
  else if(parts[0]==='person')html=vPerson(parts[1]);
  else if(parts[0]==='pods')html=vPods();
  else if(parts[0]==='pod')html=vPod(parts[1]);
  else if(parts[0]==='episode')html=vEpisode(parts[1]);
  else if(parts[0]==='marks'||parts[0]==='stats'||parts[0]==='mine'){parts[0]='mine';html=vStats();}
  else html=vHome();
  $('#app').innerHTML=html;
  pangufy($('#app'));
  applyHls();hlUpdNav();
  document.body.dataset.route=parts[0]||'home';
  document.querySelectorAll('.nav .links a').forEach(a=>a.classList.toggle('on',a.dataset.route===parts[0]));
  updateMeta(parts);
  window.scrollTo(0,0);
  syncSeg();
  observeReveals();
  initTOC();
  placeAsk();
  if(parts[0]==='episode')initReadMark(parts[1]);
  // 无显式 ?at/?hl 时，自动回到上次读到的章节（阅读位置永不丢）
  if(parts[0]==='episode'&&!pendingLocate){const rp=readPosGet()[parts[1]];if(rp&&rp.s>0&&!readHas(parts[1]))pendingLocate={id:parts[1],at:rp.s,hl:''};}
  applyLocate();
  trackView();
  // 页脚的站点地图在骨架屏阶段不该露出来(它排在 #app 之后,加载动画期间会先冒出一行)
  document.body.dataset.ready='1';
}
let pendingLocate=null;
function applyLocate(){
  if(!pendingLocate)return;
  const {id,at,hl}=pendingLocate;
  if((location.hash||'').indexOf('/episode/'+id)<0){pendingLocate=null;return;}  // 已离开该期
  if(!document.querySelector('.reader .sec-h'))return;   // 逐字稿还没加载，等下次 render
  pendingLocate=null;
  let target=null;
  if(hl){const base=(hl||'').replace(/\s/g,'');   // 去空格/换行（选区可能跨发言、含说话人标签）
    if(base.length>=6){const els=[...document.querySelectorAll('.reader .turn .en,.reader .turn .zh')];
      for(const L of [40,30,22,16,10]){const snip=base.slice(0,Math.min(L,base.length));if(snip.length<6)continue;
        const hit=els.find(el=>el.textContent.replace(/\s/g,'').includes(snip));   // 逐步缩短前缀，命中选区开头那条
        if(hit){target=hit.offsetParent?hit:hit.closest('.turn');break;}}}}   // 命中隐藏行（跨语言）→定位其发言块
  if(!target&&at!=null&&at!==''){target=document.getElementById('sec-'+at);}
  if(!target)return;
  // scrollIntoView 会把 content-visibility:auto 的目标强制变为已渲染,坐标准确;
  // 多次校正:CV 段落在滚动路径上陆续渲染会挤动布局,600/1400ms 再对齐一次
  const go=()=>{try{target.scrollIntoView({block:'start'});}catch(_){}};
  requestAnimationFrame(go); setTimeout(go,600); setTimeout(go,1400);
  target.classList.add('locate-flash');setTimeout(()=>target.classList.remove('locate-flash'),2800);
}
/* 按路由更新标题/描述/OG —— 微信在内置浏览器分享当前页时会读实时标题 */
function metaSet(key,isProp,val){const sel=isProp?`meta[property="${key}"]`:`meta[name="${key}"]`;
  let m=document.querySelector(sel);if(!m){m=document.createElement('meta');m.setAttribute(isProp?'property':'name',key);document.head.appendChild(m);}
  m.setAttribute('content',val);}
function updateMeta(parts){
  let title='AI Podcast · AI 播客 — 双语播客全文阅读';
  let desc='知名 AI 人物的播客 · 双语全文阅读，原文与翻译对照，核心观点速览。';
  if(parts[0]==='episode'){const e=EPISODES.find(x=>x.id===parts[1]);if(e){const p=PEOPLE[e.pid];
    title=`${e.tZh} · ${p.zh} — AI Podcast`;
    // e.sZh 首屏可能还没到(移出内联,随 mcp-data/ep/<id>.json 回填后 render() 会重跑本函数)
    desc=`${p.zh}（${e.pod.zh}）双语全文 + 核心观点。${e.sZh||''}`.trim();}}
  else if(parts[0]==='person'){const p=PEOPLE[parts[1]];if(p){title=`${p.zh} · ${p.en} — AI Podcast`;desc=`${p.zh}（${p.tiZh}）的播客，双语全文阅读。`;}}
  else if(parts[0]==='pod'){const k=POD_SLUG[parts[1]],i=POD_INFO[k];if(i){title=`${k} · ${i.zh} — AI Podcast`;desc=i.cn;}}
  else if(parts[0]==='ask'){title='问全站 · 向 AI 人物的观点提问 — AI Podcast';desc='基于全站播客的核心观点综合回答，对比不同 AI 人物的看法，出处可溯。';}
  else if(parts[0]==='topics'){title='议题 · 同一议题不同声音 — AI Podcast';desc='把不同 AI 人物对 AGI 时间表、规模化、对齐安全、开源闭源等议题的观点聚到一起横向对照。';}
  else if(parts[0]==='topic'){const d=(typeof TOPICS!=='undefined')&&TOPICS.defs.find(x=>x.slug===parts[1]);if(d){title=`${d.zh} · ${d.en} — AI Podcast 议题`;desc=`不同 AI 人物对「${d.zh}」的观点对照。`;}}
  document.title=title;
  metaSet('description',false,desc);
  metaSet('og:title',true,title);metaSet('twitter:title',true,title);
  metaSet('og:description',true,desc);metaSet('twitter:description',true,desc);
  metaSet('og:url',true,'https://aipodcast.jasonlin.tech/'+(location.hash||''));
}
function observeReveals(){
  const io=new IntersectionObserver((es)=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:0,rootMargin:'0px 0px -5% 0px'});
  document.querySelectorAll('.reveal:not(.in)').forEach(el=>io.observe(el));
}
const MCP_URL='https://mcp.jasonlin.tech/mcp';
function copyMcp(){navigator.clipboard&&navigator.clipboard.writeText(MCP_URL);const b=$('#mcpCopy');if(b){b.textContent='已复制';setTimeout(()=>b.textContent='复制',1500);}}
function copyShare(id){const u='https://aipodcast.jasonlin.tech/e/'+id+'/';if(navigator.clipboard)navigator.clipboard.writeText(u);const b=$('#shareBtn');if(b){b.textContent='已复制链接';setTimeout(()=>b.textContent='分享',1600);}}
function footer(){return `<footer class="footer"><div class="wrap">
  <div class="mcp-note">
    <b style="color:var(--text-2)">接入 AI 助手 · MCP</b> — 全站 ${EPISODES.length} 期双语全文，可接入 Claude、Cursor 等做问答。只读、免费、无需 key。<br>
    <code class="mcp-url">${MCP_URL}</code><button id="mcpCopy" class="mcp-copy" onclick="copyMcp()">复制</button>
  </div>
  <div class="mcp-note" id="syncPanel"><div class="legal-note" style="margin-bottom:14px"><b>姊妹站</b> — 同一批人物，三种读法：<a href="https://aipaper.jasonlin.tech" target="_blank" rel="noopener" style="color:var(--accent)">AI Paper</a>（他们的论文与长文，双语全文）· <a href="https://ai.jasonlin.tech" target="_blank" rel="noopener" style="color:var(--accent)">AI 学者图谱</a>（谁和谁共事、师承、合创）。另有 <a href="https://hardware.jasonlin.tech" target="_blank" rel="noopener" style="color:var(--accent)">硬件</a>、<a href="https://investor.jasonlin.tech" target="_blank" rel="noopener" style="color:var(--accent)">投资</a>、<a href="https://design.jasonlin.tech" target="_blank" rel="noopener" style="color:var(--accent)">设计</a>三个姊妹图谱。阅读记录用同一个同步码互通。</div>
    ${syncPanelHtml()}</div>
  <b style="color:var(--text-2)">AI Podcast · AI 播客</b> — 知名 AI 人物播客，双语阅读。<a href="https://feed.jasonlin.tech/aipodcast.xml" style="color:var(--accent)">📡 RSS 订阅</a><br>
  内容版权归原播客方；双语全文为 AI 转录翻译，仅供学习，以原节目为准。权利人如需下架：<a href="mailto:linzheng3535@gmail.com?subject=AI%20Podcast%20Takedown%20Request">linzheng3535@gmail.com</a>，即刻处理。<br>
  译文 AI 生成，偶有瑕疵；照片来自 <a href="https://commons.wikimedia.org" target="_blank">Wikimedia</a> 及本人公开主页、封面来自 Apple Podcasts，仅作识别；匿名统计，无 Cookie。分类法来自 <a href="https://ai.jasonlin.tech" target="_blank">AI 人物图谱</a>。
</div></footer>`;}

/* init */
if(localStorage.theme)document.documentElement.dataset.theme=localStorage.theme;
/* iOS Safari 的状态栏区域跟随 <meta name="theme-color"> 与 color-scheme,但**它在页面加载时
   定色之后,对已存在 meta 的 content 变更不会重新取色** —— 2026-08-15 真机实测:以深色进入
   再切浅色,页面已经变白而状态栏仍是黑的。可靠做法是把 meta **删掉重建**(换成新元素),
   并把 color-scheme 直接写成行内样式(比等 CSS 规则随属性重新匹配更确定地触发重绘)。
   data-theme 会被多处改写(手动切换 / 启动恢复 / 多设备同步),用 observer 统一跟随。 */
(function(){
  let first=true;
  const upd=()=>{
    const dark=document.documentElement.dataset.theme==='dark';
    document.documentElement.style.colorScheme=dark?'dark':'light';
    document.querySelectorAll('meta[name="theme-color"]').forEach(n=>n.remove());
    const m=document.createElement('meta');m.name='theme-color';m.content=dark?'#0e0e10':'#fcfcfe';
    document.head.appendChild(m);
    /* iOS Safari 只在加载/导航时给状态栏定色,运行时换了 meta 也不重绘
       (Jason 真机实测:切换主题后要跳去别的网页再回来才生效)。这里用 1px 滚动
       微调去触发它的 scroll-edge 重算 —— 视觉上察觉不到,失败也无害(下次导航自然正确)。
       首次调用不做,免得干扰浏览器的滚动位置恢复。 */
    if(first){first=false;return;}
    /* 必须显式 behavior:'instant' —— 站点 html 上有 scroll-behavior:smooth,
       默认会把这两次程序化滚动变成动画,肉眼可见地抖一下,而且异步没跑完就被下一句打断
       (实测滚动位置从 1333 漂到 1381)。 */
    try{const y=window.scrollY;
      window.scrollTo({top:y+(y>0?-1:1),behavior:'instant'});
      window.scrollTo({top:y,behavior:'instant'});}catch(_){}
  };
  new MutationObserver(upd).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  upd();})();
if(localStorage.lang)document.body.dataset.lang=localStorage.lang;
if(localStorage.size)document.body.dataset.size=localStorage.size;
document.body.dataset.order=localStorage.order||'en';
window.addEventListener('hashchange',render);
document.addEventListener('keydown',e=>{
  const typing=/^(INPUT|TEXTAREA)$/.test((document.activeElement||{}).tagName||'');
  if((e.key==='/'||((e.metaKey||e.ctrlKey)&&e.key==='k'))&&!typing){e.preventDefault();openSearch();}
  else if(e.key==='Escape'&&$('#searchOverlay').classList.contains('on')){closeSearch();}
});
ttsInit();
render();
if(syncCode())syncPull();   // 开启同步的设备:启动即拉取合并
/* data/ep-extra.json(gzip 558KB)原本每次开页都拉,但它只有两个真正的用途:
   ① 单集页的核心观点/速览 —— 已改由 mcp-data/ep/<id>.json 提供(那个文件单集页本来就要拉);
   ② 全站搜索里按观点句检索 —— 改成打开搜索面板时才拉(绝大多数访客根本不搜)。
   首屏因此完全不碰这 558KB。 */
