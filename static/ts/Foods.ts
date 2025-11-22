import EventHandler from "./eventhandler/EventHandler.js";
import { Card } from "./eventhandler/EventHandler.js";
import { GEH } from "./Core.js";
import {
	Boomerang,
	Bun,
	Chocolate,
	ChocolateDot,
	CoffeeBubble, Egg,
	FreezingBun,
	Missile, SausageAir, SausageLand, SnowEgg,
	Star,
	WaterBullet,
	WineBullet
} from "./Bullets.js";
import { level } from "./Level.js";
import { MapGrid } from "./GameBattlefield.js";
import { t } from "./i18n/index.js";

import { Mouse, CommonMouse } from "./Mice.js";
import type { IRenderer } from "./renderer/IRenderer.js";

const specialGenerate = function (x: number, y: number, star = 0, skillLevel = 0, type = 0) {
	const food = level.Foods[y * level.column_num + x];
	switch (type) {
		case 0: {
			level.createSpriteAnimation(
				(x * level.row_gap + level.column_start - 20),
				(y * level.column_gap + level.row_start - 60),
				"/images/foods/icecream/idle.png",
				16,
				{
					function: () => {
						food.layers.forEach((layer: MapGrid<Food>) => {
							const name = layer?.constructor?.name;
							if (name) {
								level.Cards.forEach((card: Card) => {
									if (card.name === name && card.cooling) {
										card.remainTime = 0;
									}
								});
							}
						});
					},
					zIndex: Math.min(y * level.column_num + x + 10, level.row_num * level.column_num)
				}
			);
			break;
		}
		case 1: {
			level.createSpriteAnimation(
				(x * level.row_gap + level.column_start - 10),
				(y * level.column_gap + level.row_start - 40),
				"/images/foods/groundcoffee/idle.png",
				13,
				{
					function: () => {
						if (food?.layer_1) {
							food.layer_1.wakeUp();
						}
						if (star === 16 && level.Mice?.[y]?.[x]) {
							level.Mice[y][x].forEach((value: Mouse) => value.getDamaged(9999));
						}
					},
					zIndex: Math.min(y * level.column_num + x + 10, level.row_num * level.column_num)
				}
			);
			break;
		}
		case 2: {
			GEH.requestPlayAudio('saizi');
			level.createSpriteAnimation(
				(x * level.row_gap + level.column_start - 2),
				(y * level.column_gap + level.row_start - 20),
				"/images/foods/cork/idle.png",
				40,
				{
					function: () => {
						if (food?.layer_1?.constructor.name === 'ratnest') {
							food.layer_1?.remove();
							food.layer_1 = null;
						}
					},
					zIndex: Math.min(y * level.column_num + x + 10, level.row_num * level.column_num),
				}
			);
			break;
		}
		default: {
			throw new Error("Unknown special generate.");
		}
	}
	if (food?.water) {
		level.Battlefield.playPlantAnimation(1, x, y);
	}
	else {
		level.Battlefield.playPlantAnimation(0, x, y);
	}
	return true;
}
export class Food {
	static name = "stove";		//名称
	static get cName(): string {
		return t("A000_CNAME");
	}
	static assets = ["idle"];
	static assetFormat: "png" | "webp" = "png";
	static offset = [0, 0];
	static category = "";
	static cost = 50;
	static coolTime = 7500;
	static description = "";
	static get upgrade(): string {
		return t("U000");
	}
	static rarity = 0;
	static story = "";
	static addCost = false;
	static special: string | undefined = undefined;
	protected readonly type: number | undefined;
	readonly star: number = 0;
	starAnimTick: number = 0;
	protected readonly starAnimOffset: number = 0;
	readonly starAnimLength: number = 0;
	readonly starAnim: string | undefined;
	public x: number = 0;
	public y: number = 0;
	ignored: boolean = false;
	ladder: string | undefined;
	static idleLength: number = 12;
	static artist: string | undefined;
	static storyContributor: string | undefined;
	static type: number | undefined;
	static inside: boolean | undefined;
	static endLength: number | undefined;
	get inside(): null | string {
		return null;
	}
	static generate(x: number, y: number, star: number, skillLevel: number) {
		const food = level.Foods[y * level.column_num + x];

		if (food.noPlace || (food.water && !food.layer_2)) {
			return false;
		}

		if (!food.layer_1 && (food.water || !food.layer_2)) {
			food.layer_1 = new this(x, y, food.water ? 1 : 0, star, skillLevel);
			return true;
		}

		return false;
	};
	static SHADOW_IMAGE = "/images/interface/shadow.svg";
	#health = 300;
	get health() {
		return this.#health;
	}
	set health(value) {
		if (value <= 0) {
			this.remove();
		}
		else if (value < this.#health) {
			this.getDamagedTag = true;
		}
		this.#health = value;
	}
	width = 50;
	height = 50;
	get entity() {
		const ctor = this.constructor as typeof Food;
		return `/images/foods/${ctor.name}/${this.state}.${ctor.assetFormat}`;
	}

	row = 0;			//所在行
	column = 0;			//所在列
	attackable = true;		//是否可以被攻击
	short = false;			//是否低矮（不会被啃食）
	tall = false;					//是否身形高大（不可被越过）

	canReverseBoost = false;		//是否可以反弹子弹
	canFireBoost = false;			//是否可以引燃子弹
	canBlockBoost = false;			//是否可以移除子弹
	canShovel = true;				//是否可以被铲除

	behaviorInterval: number | null = null;		//行为时间间隔
	remainTime: number | null = null;				//当前剩余时间

	stateSet = ["idle"];			//状态集合
	state = this.stateSet[0];		//当前状态
	stateLengthSet = [12];			//状态时间长度集合
	stateLength = this.stateLengthSet[0];	//当前状态时间长度
	tick = 0;						//当前时间戳
	getDamagedTag = false;
	get ctx(): IRenderer | CanvasRenderingContext2D {
		return level.Battlefield.ctxBG as IRenderer | CanvasRenderingContext2D;
	}
	get parent() {
		return level;
	}
	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		this.column = x;
		this.row = y;
		this.type = type;
		this.star = star;

		if (this.star >= 4) {
			this.starAnimTick = 0;
			this.starAnimOffset = 0;
			this.starAnimLength = 1;
			switch (this.star) {
				case 4:
				case 5: {
					this.starAnimLength = 1;
					break;
				}
				case 6: {
					this.starAnimLength = 8;
					break;
				}
				case 7: {
					this.starAnimLength = 8;
					break;
				}
				case 8: {
					this.starAnimLength = 8;
					break;
				}
				case 9: {
					this.starAnimOffset = 3;
					this.starAnimLength = 8;
					break;
				}
				case 10: {
					this.starAnimOffset = 6;
					this.starAnimLength = 8;
					break;
				}
				case 11: {
					this.starAnimOffset = 10;
					this.starAnimLength = 8;
					break;
				}
				case 12: {
					this.starAnimOffset = 10;
					this.starAnimLength = 8;
					break;
				}
				default: {
					throw "未加载的卡片星级";
				}
			}
			this.starAnim = "/images/interface/star/" + this.star + ".png";
		}
		level.Battlefield.playPlantAnimation(type, x, y);
	}
	initialPlant = (x: number, y: number, type: number) => {
		const currentConstructor = this.constructor as typeof Food;
		this.x = level.column_start + x * level.row_gap + currentConstructor.offset[0];
		this.y = level.row_start + y * level.column_gap + currentConstructor.offset[1] + (type === 1 ? - 10 : 0);
	}
	behavior() {
		this.tick = (this.tick + 1) % this.stateLength;
	}
	CreateUnderlayAnim(width = 72, height = 36) {
		const shadow = GEH.requestDrawImage(Food.SHADOW_IMAGE);
		if (shadow) {
			// 基准位置：基于 column 和 row
			const baseX = (this.column + 0.5) * level.row_gap + level.column_start;
			const baseY = (this.row + 1) * level.column_gap + level.row_start;
			// 计算偏移量：当前 x/y 与基准位置的差值
			const currentConstructor = this.constructor as typeof Food;
			const expectedX = level.column_start + this.column * level.row_gap + currentConstructor.offset[0];
			const expectedY = level.row_start + this.row * level.column_gap + currentConstructor.offset[1] + (this.type ? -10 : 0);
			const offsetX = this.x - expectedX;
			const offsetY = this.y - expectedY;
			// 最终位置：基准位置 + 偏移量
			const shadowX = baseX - width / 2 + 4 + offsetX;
			const shadowY = baseY - height + offsetY;
			this.ctx.drawImage(shadow, shadowX, shadowY, width, height);
		}
	}
	CreateOverlayAnim() {
		if (this.star >= 4) {
			const star = GEH.requestDrawImage(this.starAnim!);
			if (star) {
				const { width, height } = star;
				// 基准位置：基于 column 和 row
				const baseX = (this.column + 0.5) * level.row_gap + level.column_start;
				const baseY = (this.row + 1) * level.column_gap + level.row_start;
				// 计算偏移量：当前 x/y 与基准位置的差值
				const currentConstructor = this.constructor as typeof Food;
				const expectedX = level.column_start + this.column * level.row_gap + currentConstructor.offset[0];
				const expectedY = level.row_start + this.row * level.column_gap + currentConstructor.offset[1] + (this.type ? -10 : 0);
				const offsetX = this.x - expectedX;
				const offsetY = this.y - expectedY;
				// 最终位置：基准位置 + 偏移量
				const x = baseX - width / this.starAnimLength / 2 + 4 + offsetX;
				const y = baseY - height * 1.5 + (this.type ? -10 : 0) + this.starAnimOffset + offsetY;
				this.ctx.drawImage(star,
					width / this.starAnimLength * this.starAnimTick, 0,
					width / this.starAnimLength, height,
					x, y,
					width / this.starAnimLength, height);
				this.starAnimTick = (this.starAnimTick + 1) % this.starAnimLength;
			}
		}
	}
	ignore(src = "ladder") {
		this.ignored = true;
		this.ladder = "/images/interface/" + src + ".png";
	}

	hugeWaveHandler() {
		return;
	}

	wakeUp() {
		return true;
	}

	getDamaged(value = 10, origin: Mouse | null = null) {
		this.health = this.health - value;
	}

	getCrashDamaged(value = 10, origin: Mouse | null = null) {
		this.getDamaged(value, origin);
	}

	remove() {
		level.Foods[this.row * level.column_num + this.column].layer_1 = null;
	}

	addCost(cost: number) {
		if (cost <= 0) {
			return false;
		}
		else {
			level.Cards.find((value: Card) => {
				if (value.name === this.constructor.name) {
					value.cost += cost;
					return true;
				}
			})
		}
	}

	reduceCost(cost: number) {
		if (cost <= 0) {
			return false;
		}
		else {
			level.Cards.find((value: Card) => {
				if (value.name === this.constructor.name) {
					value.cost -= cost;
					return true;
				}
			})
		}
	}
}
export class Character extends Food {
	static name = 'player';
	static offset = [-38, -78];
	width = 129;
	height = 129;
	stateLengthSet = [8, 6];
	stateSet = ['idle', 'attack'];
	stateLength = this.stateLengthSet[0];
	canShovel = false;
	private readonly damage: number = 0;
	behaviorInterval: number = 0;
	remainTime: number = 0;
	get entity() {
		return "/images/character/" + this.constructor.name + "/" + this.state + ".png";
	}

	get weapon() {
		return "/images/character/weapon/bun/" + this.state + ".png";
	}

	constructor(x = 0, y = 0, type = 0) {
		super(x, y, type);
		this.initialPlant(x, y, type);
		this.damage = 20;
		this.behaviorInterval = 2000;
		this.remainTime = this.behaviorInterval;
	}

	behavior() {
		if (this.remainTime <= 0) {
			if (this.state === this.stateSet[0]) {
				if (this.attackCheck()) {
					this.state = this.stateSet[1];
					this.stateLength = this.stateLengthSet[1];
					this.tick = 0;
				}
			} else if (this.state === this.stateSet[1]) {
				if (this.tick === 3) {
					this.fire();
				}
				if (this.tick === this.stateLength - 1) {
					this.tick = 0;
					this.state = this.stateSet[0];
					this.stateLength = this.stateLengthSet[0];
					this.remainTime = this.behaviorInterval;
				}
			}
		}

		this.tick = (this.tick + 1) % this.stateLength;
	}

	CreateOverlayAnim() {
		const img = GEH.requestDrawImage(this.weapon);
		if (img) {
			this.ctx.drawImage(img, this.width * this.tick, 0, this.width,
				this.height, this.x, this.y, this.width, this.height);
		}
	}

	attackCheck() {
		return level.getMiceInRow(this.row).some((mouse: Mouse[]) => mouse != null && mouse.length > 0);
	}

	fire() {
		GEH.requestPlayAudio("zidan");
		this.parent.requestSummonBullet(Bun, this.x + 110, this.y + 110, this.damage, 0);
	}

	remove() {
		if (!GEH.GameEnd) {
			if (level) {
				level.defeat();
			}
		}
		super.remove();
	}
}
class Stove extends Food {
	static name = "stove";
	static get cName(): string {
		return t("A001_CNAME");
	}
	static assets = ["idle", "produce"];
	static offset = [9, -58];
	static get category(): string {
		return t("C000");
	}
	static cost = 50;
	static coolTime = 7500;
	static description = "定时产出额外火苗";
	static upgrade = "强化后提高[产出速率]";
	static rarity = 0;
	static story = "我们当着火炉,不是照亮自己,而是普照世界。";

	width = 50;
	height = 112;
	stateLengthSet = [12, 17];
	stateSet = ["idle", "produce"];
	behaviorInterval: number = 0;
	remainTime: number = 0;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.behaviorInterval = 25000 - star * 1000;
		this.remainTime = this.behaviorInterval;
	}

	behavior() {
		if (this.remainTime <= 0) {
			if (this.state === this.stateSet[0]) {
				this.tick = 0;
				this.state = this.stateSet[1];
				this.stateLength = this.stateLengthSet[1];
			} else if (this.state === this.stateSet[1]
				&& this.tick === this.stateLength - 1) {
				this.tick = 0;
				this.state = this.stateSet[0];
				this.stateLength = this.stateLengthSet[0];
				this.remainTime = this.behaviorInterval;
				this.produce();
			}
		}
		super.behavior();
	}

	produce() {
		const randomX = this.x + 40 - Math.floor(Math.random() * 12);
		this.parent.produceSun(randomX, this.y + 90, 25, 1);
	}
}
class BunShooter extends Food {
	static name = "bunshooter";
	static get cName(): string {
		return t("A002_CNAME");
	}
	static assets = ["attack", "idle"];
	static offset = [5, -10];
	static get category(): string {
		return t("C001");
	};
	static cost = 100;
	static coolTime = 7500;
	static description = "发射可以造成伤害的包子";
	static upgrade = "强化后提高[攻击伤害]";
	static rarity = 1;
	static story = "笼包一旦接受了自己的软弱，就将是无敌的。";

	width = 66;
	height = 64;
	stateLengthSet = [12, 6];
	stateSet = ["idle", "attack"];
	attackTick = [5];

	damage: number = 0;
	behaviorInterval: number = 0;
	remainTime: number = 0;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.damage = 25 + star * 5;
		this.behaviorInterval = 2000;
		this.remainTime = this.behaviorInterval;
	}

	behavior() {
		if (this.remainTime <= 0) {
			if (this.state === this.stateSet[0] && this.attackCheck()) {
				this.state = this.stateSet[1];
				this.stateLength = this.stateLengthSet[1];
				this.tick = 0;
			} else if (this.state === this.stateSet[1]) {
				if (this.attackTick.includes(this.tick)) {
					this.fire();
				}
				if (this.tick === this.stateLength - 1) {
					this.tick = 0;
					this.state = this.stateSet[0];
					this.stateLength = this.stateLengthSet[0];
					this.remainTime = this.behaviorInterval;
				}
			}
		}
		super.behavior();
	}

	attackCheck() {
		return level.getMiceInRow(this.row).some((mouse: Mouse[]) => mouse && mouse.length > 0);
	}

	fire() {
		GEH.requestPlayAudio("zidan");
		const randomY = this.y + 24 + Math.floor(Math.random() * 5);
		this.parent.requestSummonBullet(Bun, this.x + 60, randomY, this.damage, 0);
	}
}
class Toast extends Food {
	static name = "toast";
	static get cName(): string {
		return t("A003_CNAME");
	}
	static assets = ["critical_1", "critical_2", "idle"];
	static offset = [1, -2];
	static get category(): string {
		return t("C002");
	};
	static cost = 50;
	static coolTime = 30000;
	static description = "阻挡老鼠以保护身后卡片";
	static upgrade = "强化后提高[生命值]";
	static story = "アンパンマン、優しい君は、行け!みんなの梦守るため。";

	width = 68;
	height = 58;
	stateSet = ["idle", "critical_1", "critical_2"];
	protected fullHealth: number = 0;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.health = 3000 + star * 200;
		this.fullHealth = this.health;
	}

	CreateOverlayAnim() {
		if (this.ignored) {
			const { column_gap, row_gap, column_start, row_start } = level;
			const { column, row } = this;
			const x = column * column_gap + column_start + 32;
			const y = row * row_gap + row_start - 8;
			const img = GEH.requestDrawImage(this.ladder!);
			if (img) {
				this.ctx.drawImage(img, x, y, img.width, img.height);
			}
		}
		super.CreateOverlayAnim();
	}

	getDamaged(value = 10, origin: Mouse | null = null) {
		super.getDamaged(value);
		const { fullHealth } = this;
		if (this.health <= fullHealth / 3) {
			this.state = "critical_2";
		} else if (this.health <= fullHealth * 2 / 3) {
			this.state = "critical_1";
		}
	}
}
class FlourSack extends Food {
	static name = "floursack";
	static get cName(): string {
		return t("A004_CNAME");
	}
	static assets = ["attack_l", "attack_r", "idle"];
	static offset = [-15, -70];
	static get category(): string {
		return t("C001");
	}
	static cost = 50;
	static coolTime = 30000;
	static description = "碾压老鼠，造成伤害后消失";
	static upgrade = "强化后缩短[冷却时间]";
	static rarity = 0;
	static story = "惹恼了它等着你的只有“天降正义”——不过呢，就算是“正义”，偶尔也得打个瞌睡。";
	static storyContributor = "@Weirdo.";
	static idleLength = 9;
	damage = 1800;
	width = 95;
	height = 141;
	stateLength = 9;
	left: number = 0;
	positionX: number = 0;
	positionY: number = 0;
	tag: number = 0;
	target: Mouse | undefined;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
	}

	CreateUnderlayAnim(width = 72, height = 36) {
		const param = 2;
		const { column_gap, row_start } = level;
		const { x, row } = this;

		const img = GEH.requestDrawImage(Food.SHADOW_IMAGE);
		if (img) {
			let modifiedWidth = width;
			let modifiedHeight = height;
			if (this.state === "attack_r" || this.state === "attack_r") {
				if (this.tick >= 3 && this.tick <= 5) {
					modifiedWidth = width - (this.tick - 2) * 2 * param;
					modifiedHeight = height - (this.tick - 2) * param;
				} else if (this.tick === 6) {
					modifiedWidth = width - 3 * 2 * param;
					modifiedHeight = height - 3 * param;
				} else if (this.tick >= 7 && this.tick <= 9) {
					modifiedWidth = width - (10 - this.tick) * 2 * param;
					modifiedHeight = height - (10 - this.tick) * param;
				}
			}
			this.ctx.drawImage(img, x + this.width / 2 - modifiedWidth / 2 - 3, (row + 1) * column_gap + row_start - modifiedHeight, modifiedWidth, modifiedHeight);
		}
	}

	attackCheck() {
		const { Mice } = level;
		const { row, column } = this;

		for (let i = column - 1; i <= column + 1; i++) {
			if (Mice[row][i]?.length > 0) {
				for (let j = 0; j < Mice[row][i].length; j++) {
					const mouse = Mice[row][i][j] as Mouse;
					if (mouse.attackable && !mouse.fly) {
						return this.target = mouse;
					}
				}
			}
		}
		return false;
	}

	attack() {
		const { Mice } = level;
		const { positionX, positionY, tag } = this;
		const { damage } = this;

		GEH.requestPlayAudio("yadao");

		for (let i = positionX + tag - 1; i <= positionX + tag + 1; i++) {
			if (Mice[positionY][i]?.length > 0) {
				for (let j = 0; j < Mice[positionY][i].length; j++) {
					const mouse = Mice[positionY][i][j];
					if (mouse.attackable
						&& !mouse.fly
						&& Math.abs(positionX + 0.5 + tag - mouse.positionX) <= 0.72) {
						mouse.getDamaged(damage);
					}
				}
			}
		}
	}

	behavior() {
		if (this.target) {
			if (this.tick >= 3 && this.tick <= 9) {
				this.attackable = false;
				this.x += (60 / 7) * this.tag;
			} else if (this.tick === 12) {
				this.attack();
			} else if (this.tick === this.stateLength - 1) {
				this.remove();
			}
		}
		else {
			if (this.attackCheck() && this.target) {
				const target = this.target as Mouse;
				GEH.requestPlayAudio("en");
				this.positionY = this.row;
				this.positionX = this.column;
				this.tick = 0;
				this.state = target.column >= this.column ? "attack_r" : "attack_l";
				this.stateLength = 18;
				this.tag = Math.max(-1, Math.min(1, target.column - this.column));
			}
		}
		super.behavior();
	}
}
class SnowBunShooter extends BunShooter {
	static name = "snowbunshooter";
	static get cName(): string {
		return t("A005_CNAME");
	}
	static offset = [5, -13];
	static get category(): string {
		return t("C001");
	};
	static cost = 150;
	static coolTime = 7500;
	static description = "发射可以造成伤害并减速的包子";
	static upgrade = "强化后提高[攻击伤害]";
	static rarity = 1;
	static story = "似乎是在冰箱里冻住的小笼包，就是不知道这种包子能不能吃。据说以前有人非常喜欢它。";
	static storyContributor = "@永远爱冰包";
	width = 68;
	height = 68;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.damage = 25 + star * 5;
	}

	fire() {
		GEH.requestPlayAudio("zidan");
		this.parent.requestSummonBullet(FreezingBun, this.x + 60, this.y + 24 + Math.floor(Math.random() * 5), this.damage, 0);
	}
}
class RatClip extends Food {
	static name = "ratclip";
	static get cName(): string {
		return t("A006_CNAME");
	}
	static assets = ["explode", "getready", "idle", "ready"];
	static generate(x: number, y: number, star: number, skillLevel: number) {
		const food = level.Foods[y * level.column_num + x];

		if (food.noPlace || (!food.water && !food.layer_1)) {
			food.layer_1 = new this(x, y, 0, star, skillLevel);
			return true;
		}

		return false;
	};
	static offset = [-51, -68];
	static get category(): string {
		return t("C001");
	};
	static cost = 25;
	static coolTime = 30000;
	static description = "需要时间就绪才能引爆的接触型炸弹";
	static upgrade = "强化后减少[就绪耗时]";
	static idleLength = 8;
	static story = "这是个嗜睡的鼠夹——要不是在地底下呆久了需要透透气，可能就再也不露头了。";
	static storyContributor = "@零殇";
	damage = 1800;
	width = 180;
	height = 180;
	stateLength = 8;
	remainTime: number = 0;
	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.remainTime = 15000 - star * 500;
	}

	behavior() {
		if (this.remainTime <= 0) {
			if (this.state === "idle") {
				GEH.requestPlayAudio("jiazi");
				this.tick = 0;
				this.state = "getready";
				this.stateLength = 9;
			} else if (this.state === "getready") {
				if (this.tick === this.stateLength - 1) {
					this.tick = 0;
					this.stateLength = 8;
					this.state = "ready";
				}
				this.getDamaged = ((value, origin) => {
					this.attackable = false;
					this.tick = 0;
					this.state = "explode";
					this.stateLength = 10;
					this.explode();
				})
			} else if (this.state === "explode") {
				if (this.tick === this.stateLength - 1) {
					this.remove();
				}
			} else {
			}
		}
		super.behavior();
	}

	explode() {
		GEH.requestPlayAudio("jiazibao");
		const mice = level.getMiceAt(this.row, this.column);
		for (let i = 0; i < mice.length; i++) {
			mice[i].getBlast(this.damage);
		}
	}
}
class SaladPult extends BunShooter {
	static name = "saladpult";
	static get cName(): string {
		return t("A007_CNAME");
	}
	static offset = [-1, -18];
	static get category(): string {
		return t("C001");
	};
	static cost = 100;
	static coolTime = 7500;
	static description = "投掷在两个目标间弹跳并造成伤害的番茄";
	static upgrade = "强化后提高[攻击伤害]";
	static rarity = 1;
	static story = "时至今日，番茄沙拉投手仍会想起和向日葵、苹果和茄子在一起的曼妙时光。";
	static storyContributor = "@蓝色的黑钻";
	width = 68;
	height = 72;
	stateLengthSet = [12, 10];
	attackTick = [6];

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.damage = 45 + star * 10;
		this.behaviorInterval = 4000;
		this.remainTime = this.behaviorInterval;
	}

	fire() {
		GEH.requestPlayAudio("touzhi");
		this.parent.requestSummonBullet(Missile, this.x + 48, this.y + 12, this.damage, 1, this.row);
	}
}
class Pudding extends Food {
	static name = "pudding";
	static get cName(): string {
		return t("A008_CNAME");
	}
	static offset = [5, -28];
	static get category(): string {
		return t("C000");
	}
	static cost = 100;
	static coolTime = 7500;
	static description = "使接触到的直线子弹反转";
	static upgrade = "强化后提高[生命值]";
	static rarity = 2;
	static idleLength = 9;
	static story = "“打在身上不痛不痒的，就像是在做按摩。”樱桃反弹布丁擅长反弹一切。无论是子弹、炸弹，还是邮箱里恶毒的言论——没有什么是反弹不了的。";
	static storyContributor = "@悖论引擎";

	canReverseBoost = true;
	width = 54;
	height = 82;
	stateLength = 9;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.health = 300 + star * 100;
	}
}
class Brazier extends Food {
	static name = "brazier";
	static get cName(): string {
		return t("A009_CNAME");
	}
	static offset = [4, -4];
	static get category(): string {
		return t("C000");
	}
	static description = "引燃接触到的直线子弹";
	static upgrade = "强化后提高[伤害倍率]";
	static rarity = 1;
	static story = "火盆的存在不只是为了引燃子弹，就像是火焰的存在不只是为了消融冰雪。它愿燃烧在每一个冬夜。";
	static storyContributor = "@GrassCarp_草鱼";
	static idleLength = 11;
	canFireBoost = true;
	width = 60;
	height = 59;
	stateLength = 11;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.health = 300 + star * 100;
		for (let i = -1; i <= 1; i++) {
			if (this.row + i >= 0 && this.row + i < level.row_num) {
				for (let j = -1; j <= 1; j++) {
					if (this.column + j >= 0 && this.column + j < (level.column_num + 1)) {
						let DEG = 2;
						if (i === -1 || i === 1) {
							DEG--;
						}
						if (j === -1 || j === 1) {
							DEG--;
						}
						level.lightDEGChange((this.row + i) * (level.column_num + 1) + (this.column + j), DEG);
					}
				}
			}
		}
	}

	remove() {
		for (let i = -1; i <= 1; i++) {
			if (this.row + i >= 0 && this.row + i < level.row_num) {
				for (let j = -1; j <= 1; j++) {
					if (this.column + j >= 0 && this.column + j < (level.column_num + 1)) {
						let DEG = 2;
						if (i === -1 || i === 1) {
							DEG--;
						}
						if (j === -1 || j === 1) {
							DEG--;
						}
						level.lightDEGChange((this.row + i) * (level.column_num + 1) + (this.column + j), - DEG);
					}
				}
			}
		}
		super.remove();
	}
}
class WatermelonRind extends Toast {
	static name = "watermelonrind";
	static get cName(): string {
		return t("A010_CNAME");
	}
	static generate(x: number, y: number, star: number, skillLevel: number) {
		const food = level.Foods[y * level.column_num + x];
		if (food.noPlace || (food.water && !food.layer_2) || food.layer_0) {
			return false;
		}

		if (food.water) {
			food.layer_0 = new this(x, y, 1, star, skillLevel);
		} else {
			food.layer_0 = new this(x, y, 0, star, skillLevel);
		}

		return true;
	}
	static assets = ["critical_1", "critical_1_inside", "critical_2", "critical_2_inside", "idle", "idle_inside"];
	static offset = [0, 18];
	static get category(): string {
		return t("C002");
	};
	static cost = 125;
	static coolTime = 30000;
	static description = "阻挡老鼠以保护内部卡片";
	static upgrade = "强化后提高[生命值]";
	static rarity = 2;
	static story = "“这瓜皮，硬到掉牙了。”<br>——“是你牙口不好吧，大鼠！”";
	static storyContributor = "@空白";
	static idleLength = 10;
	static inside = true;

	width = 66;
	height = 38;
	stateLength = 10;
	fullHealth: number = 0;
	get inside() {
		return "/images/foods/" + this.constructor.name + "/" + this.state + "_inside.png";
	}

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.health = 3000 + star * 200;
		this.fullHealth = this.health;
	}

	remove() {
		level.Foods[this.row * level.column_num + this.column].layer_0 = null;
	}
}
export class Plate extends Food {
	static name = "plate";
	static get cName(): string {
		return t("A011_CNAME");
	}
	static offset = [4, 26];
	static get category(): string {
		return t("C000");
	}
	static cost = 25;
	static description = "在水中承载卡片";
	static upgrade = "强化后缩短[冷却时间]";
	static rarity = 0;
	static special = "只能放置在水中";
	static story = "木盘子算美食吗？不算。但这并不妨碍它无休止地抱怨，“我不喜欢那些炉子啊，蒸笼啊什么的压在我身上——它们都太重了！”";
	static storyContributor = "@Jk.blue";
	static type = 2;
	static idleLength = 8;

	static generate(x: number, y: number, star: number, skillLevel: number) {
		if (level.Foods[y * level.column_num + x] == null) {
			return false;
		} else if (level.Foods[y * level.column_num + x].noPlace) {
			return false;
		} else if (level.Foods[y * level.column_num + x].water) {
			if (level.Foods[y * level.column_num + x].layer_2 == null) {
				if (level.Foods[y * level.column_num + x].layer_0 == null && level.Foods[y * level.column_num + x].layer_1 == null) {
					level.Foods[y * level.column_num + x].layer_2 = new this(x, y, 1, star, skillLevel);
					return true;
				} else {
					return false;
				}
			} else {
				return false;
			}
		} else {
			return false;
		}
	}

	width = 60;
	height = 43;
	stateLength = 8;
	ripple = "/images/ripple.png";
	rippleTick = 0;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
	}

	CreateOverlayAnim() {
		if (this.star >= 4) {
			const img = GEH.requestDrawImage(this.starAnim!);
			if (img) {
				const x = (this.column + 0.5) * level.row_gap + level.column_start - img.width / this.starAnimLength / 2 + 4;
				const y = (this.row + 1) * level.column_gap + level.row_start - img.height * 1.5 + (this.type ? 10 : 10) + this.starAnimOffset;
				this.ctx.drawImage(img,
					img.width / this.starAnimLength * this.starAnimTick, 0,
					img.width / this.starAnimLength, img.height,
					x, y,
					img.width / this.starAnimLength, img.height);

				this.starAnimTick = (this.starAnimTick + 1) % this.starAnimLength;
			}
		}
	}

	behavior() {
		const ripple = GEH.requestDrawImage(this.ripple);
		if (ripple) {
			this.ctx.drawImage(ripple, 72 * this.rippleTick, 0, 72, 39,
				this.column * level.row_gap + level.column_start - (this.width / 2 - level.row_gap / 2) - 6,
				this.row * level.column_gap + level.row_start - this.height / 2 + 48, 72, 39);
			this.rippleTick = (this.rippleTick + 1) % 4;
		}
		super.behavior();
	}

	remove() {
		level.Foods[this.row * level.column_num + this.column].layer_2 = null;
	}
}
class WaterPipe extends BunShooter {
	static name = "waterpipe";
	static get cName(): string {
		return t("A012_CNAME");
	}
	static offset = [1, -20];
	static get category(): string {
		return t("C001");
	};
	static cost = 125;
	static coolTime = 7500;
	static description = "向前后两个方向发射重金属液体";
	static ability = "双向直线攻击";
	static upgrade = "强化后提高[攻击伤害]";
	static rarity = 1;
	static story = "可爱的布丁小姐最好的伙伴之一，即使昔日荣光不再也有不少人喜欢它。";

	width = 63;
	height = 74;
	stateLengthSet = [12, 11];
	attackTick = [5, 9];

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.damage = 25 + star * 5;
	}

	CreateUnderlayAnim(width = 54, height = 27) {
		super.CreateUnderlayAnim(width, height);
	}

	fire() {
		GEH.requestPlayAudio("zidan");
		switch (this.tick) {
			case this.attackTick[0]:
				this.parent.requestSummonBullet(WaterBullet, this.x + 60, this.y + 32 + Math.floor(Math.random() * 5), this.damage, 0);
				this.parent.requestSummonBullet(WaterBullet, this.x + 15, this.y + 34 + Math.floor(Math.random() * 5), this.damage, 180);
				break;
			case this.attackTick[1]:
				this.parent.requestSummonBullet(WaterBullet, this.x + 15, this.y + 34 + Math.floor(Math.random() * 5), this.damage, 180);
				break;
		}
	}
}
class DoubleBunShooter extends BunShooter {
	static name = "doublebunshooter";
	static get cName(): string {
		return t("A013_CNAME");
	}
	static offset = [5, -14];
	static get category(): string {
		return t("C001");
	};
	static cost = 200;
	static coolTime = 7500;
	static description = "发射双发包子";
	static upgrade = "强化后提高[攻击伤害]";
	static rarity = 1;
	static ability = "直线攻击";
	static story = "I have a bun, I have a BunShooter. (Eh~) Duo-BunShooter!";

	width = 66;
	height = 68;
	stateLengthSet = [12, 10];
	attackTick = [5, 8];

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.damage = 25 + star * 5;
	}

	fire() {
		GEH.requestPlayAudio("zidan");
		this.parent.requestSummonBullet(Bun, this.x + 60, this.y + 26 + Math.floor(Math.random() * 5), this.damage, 0);
	}
}
class HugeStove extends Stove {
	static name = "hugestove";
	static get cName(): string {
		return t("A014_CNAME");
	}
	static cost = 150;
	static coolTime = 50000;
	static description = "定时产出额外火苗";
	static addCost = true;
	static special = "需要放置在小火炉上";
	static upgrade = "强化后提高[产出速率]";
	static rarity = 3;
	static story = "一支极大的火炉。当你担忧被它烧着，而从它旁边走过去的时候，连眼睛也难以睁开。";
	static cover = [Stove];
	static generate(x: number, y: number, star: number, skillLevel: number) {
		const food = level.Foods[y * level.column_num + x];

		if (!food || food.layer_1?.constructor === Character) {
			return false;
		}

		if (this.cover.includes(food.layer_1?.constructor)) {
			let state = 0;
			if (food.layer_1.state === 'sleep') {
				state = 2;
			}
			food.layer_1 = new this(x, y, food.water ? 1 : 0, star, skillLevel);
			food.layer_1.state = food.layer_1.stateSet[state];
			food.layer_1.stateLength = food.layer_1.stateLengthSet[state];
			return true;
		}

		if (this.cover.includes(food.layer_2?.constructor)) {
			food.layer_1 = new this(x, y, 1, star, skillLevel);
			return true;
		}

		return false;
	};
	static offset = [2, -54];
	width = 62;
	height = 108;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.behaviorInterval = (25000 - star * 1000);
		this.addCost(50);
	}

	produce() {
		level.produceSun((this.x + 40 - Math.floor(Math.random() * 12)), this.y + 90, 25, 1);
		level.produceSun((this.x + 28 - Math.floor(Math.random() * 12)), this.y + 90, 25, 1);
	}

	remove() {
		this.reduceCost(50);
		super.remove();
	}
}
class WineGlass extends Food {
	static name = "wineglass";
	static get cName(): string {
		return t("A015_CNAME");
	}
	static cost = 25;
	static get category(): string {
		return t("C000");
	}
	static description = "定时产出额外火苗";
	static special = "日间需要休眠";
	static upgrade = "强化后提高[产出速率]";
	static rarity = 0;
	static story = "予人星火者，必心怀火炉。";
	static assets = ["grow", "idle", "idle_grown", "produce", "produce_grown", "sleep"];
	static offset = [13, -56];

	get entity() {
		return "/images/foods/" + this.constructor.name + "/" + this.state + (this.produceTimes > this.growTime ? "_grown" : "") + ".png";
	}

	width = 45;
	height = 112;
	stateLengthSet = [12, 17, 8, 12];
	stateSet = ["idle", "produce", "grow", "sleep"];
	produceTimes = 0;
	growTime = 4;
	sleepAnim = "/images/sleep.png";
	sleepAnimTick = 0;
	readonly behaviorInterval: number = 0;
	remainTime: number = 0;
	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.behaviorInterval = (25000 - star * 1000);
		this.remainTime = this.behaviorInterval;
		if (level.constructor.TIME !== 1) {
			this.state = this.stateSet[3];
		}
	}

	CreateUnderlayAnim(width = 54, height = 27) {
		super.CreateUnderlayAnim(width, height);
	}

	behavior() {
		if (this.state === this.stateSet[3]) {
			this.remainTime = this.behaviorInterval;
		} else {
			if (this.remainTime <= 0) {
				if (this.state === this.stateSet[0]) {
					if (this.produceTimes === this.growTime) {
						this.tick = 0;
						this.state = this.stateSet[2];
						this.stateLength = this.stateLengthSet[2];
						GEH.requestPlayAudio("jiubeideng");
					} else {
						this.tick = 0;
						this.state = this.stateSet[1];
						this.stateLength = this.stateLengthSet[1];
					}
				} else if (this.state === this.stateSet[1]) {
					if (this.tick === this.stateLength - 1) {
						this.tick = 0;
						this.state = this.stateSet[0];
						this.stateLength = this.stateLengthSet[0];
						this.remainTime = this.behaviorInterval;
						this.produce();
					}
				} else if (this.state === this.stateSet[2]) {
					if (this.tick === this.stateLength - 1) {
						this.tick = 0;
						this.state = this.stateSet[0];
						this.stateLength = this.stateLengthSet[0];
						this.remainTime = this.behaviorInterval;
						this.produceTimes++;
					}
				}
			}
		}

		this.tick = (this.tick + 1) % this.stateLength;

		if (this.state === this.stateSet[3]) {
			const sleep = GEH.requestDrawImage(this.sleepAnim);
			if (sleep) {
				this.ctx.drawImage(sleep, 28 * this.sleepAnimTick, 0, 28, 66,
					this.x + 18, this.y + 12, 28, 66);
				this.sleepAnimTick = (this.sleepAnimTick + 1) % 10;
			}
		}
	}

	wakeUp() {
		if (this.state === this.stateSet[3]) {
			this.state = "idle";
			return true;
		}
		return false;
	}

	produce() {
		if (this.produceTimes < this.growTime) {
			this.parent.produceSun((this.x + 40 - Math.floor(Math.random() * 12)), this.y + 90, 15, 1);
		} else {
			this.parent.produceSun((this.x + 40 - Math.floor(Math.random() * 12)), this.y + 90, 25, 1);
		}
		this.produceTimes++;
	}
}
class CoffeeCup extends BunShooter {
	static name = "coffeecup";
	static get cName(): string {
		return t("A016_CNAME");
	}
	static assets = ["attack", "idle", "sleep"];
	static cost = 0;
	static description = "发射射程有限的咖啡泡";
	static special = "日间需要休眠";
	static upgrade = "强化后提高[攻击伤害]";
	static rarity = 0;
	static story = "我永恒的灵魂，注视着你的心。纵然黑夜孤寂，白昼如焚。";
	static type = 1;
	static offset = [5, 12];
	width = 60;
	height = 42;
	stateSet = ["idle", "attack", "sleep"];
	stateLengthSet = [12, 6, 12];
	sleepAnim = "/images/sleep.png";
	sleepAnimTick = 0;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.damage = 20 + star * 5;
		if (level.constructor?.TIME !== 1) {
			this.state = this.stateSet[2];
		}
	}

	CreateOverlayAnim() {
		super.CreateOverlayAnim();
		if (this.state === this.stateSet[2]) {
			const sleep = GEH.requestDrawImage(this.sleepAnim);
			if (sleep) {
				this.ctx.drawImage(sleep, 28 * this.sleepAnimTick, 0,
					28, 66, this.x + 30, this.y - 30, 28, 66);
				this.sleepAnimTick = (this.sleepAnimTick + 1) % 10;
			}
		}
	}
	behavior() {
		if (this.state === this.stateSet[2]) {
			this.remainTime = this.behaviorInterval;
		}
		super.behavior();
	}

	wakeUp() {
		if (this.state === this.stateSet[2]) {
			this.state = "idle";
			return true;
		}
		return false;
	}

	attackCheck() {
		if (level.Mice[this.row] != null) {
			for (let i = this.column; i <= Math.min(level.Mice[this.row].length, this.column + 3); i++) {
				if (level.Mice[this.row][i] != null && level.Mice[this.row][i].length > 0) {
					return true;
				}
			}
		}
		return false;
	}

	fire() {
		GEH.requestPlayAudio("zidan");
		this.parent.requestSummonBullet(CoffeeBubble, this.x + 48, this.y + 20 + Math.floor(Math.random() * 5), this.damage, 0);
	}
}
export class Cat extends Food {
	static name = "cat";
	static get cName(): string {
		return t("A00A_CNAME");
	}
	static assets = ["attack", "awake", "idle"];
	static offset = [-12, 0];
	static story = "梦想家只能在月光下找寻自己的道路。而他的惩罚，是比其他人更早见到黎明。";
	width = 94;
	height = 64;
	offsetX = 20;
	onAttack = false;
	speed = 5;
	stateLength = 10;
	stateSet = ['idle', 'awake', 'attack'];
	stateLengthSet = [10, 4, 8];
	AttackStack: Mouse[] = [];

	get positionX() {
		return EventHandler.getPositionX(this.x + this.width - this.offsetX);
	}
	constructor(x = 0, y = 0, type = 2) {
		super(x, y, type);
		this.initialPlant(x, y, type);
	}

	getDamaged(value = 0, origin = null) {
		return false;
	}

	behavior() {
		if (this.state === this.stateSet[1] && this.tick === this.stateLengthSet[1] - 1) {
			this.tick = 0;
			this.state = this.stateSet[2];
			this.stateLength = this.stateLengthSet[2];
		}
		else if (this.state === this.stateSet[2]) {
			this.attack();
		}
		super.behavior();
	}

	awake() {
		this.state = this.stateSet[1];
		this.stateLength = this.stateLengthSet[1];
		this.onAttack = true;
	}
	attack() {
		this.x += this.speed;

		if (level.Mice[this.row] != null) {
			if (level.Mice[this.row][Math.floor(this.positionX)] != null) {
				for (let i = 0; i < level.Mice[this.row][Math.floor(this.positionX)].length; i++) {
					const mouse = level.Mice[this.row][Math.floor(this.positionX)][i];
					if (mouse.attackable
						&& !this.AttackStack.includes(mouse)) {
						mouse.getOverturned(1800);
						this.AttackStack.push(mouse);
					}
				}
			}
		}

		if (this.x >= 850) {
			this.remove();
		}
	}

	remove() {
		if (level) {
			level.Guardians[this.row] = null;
		}
	}
}
export class Crab extends Cat {
	static name = "crab";
	static get cName(): string {
		return t("A00B_CNAME");
	}
	static offset = [-16, 0];
	width = 94;
	height = 64;
	offsetX = 20;
	stateLength = 7;
	stateSet = ['idle', 'awake', 'attack'];
	stateLengthSet = [7, 7, 8];

	constructor(x = 0, y = 0, type = 2) {
		super(x, y, type);
		this.initialPlant(x, y, type);
	}
}
class Takoyaki extends BunShooter {
	static name = "takoyaki";
	static cName = "章鱼烧";
	static cost = 225;
	static coolTime = 50000;
	static description = "发射可攻击任何一路敌人的回旋镖";
	static addCost = true;
	static special = "需要放置在木盘子上";
	static upgrade = "强化后提高[攻击伤害]";
	static rarity = 3;
	static story = "抛弃眼睛，才能看到真实世界！";
	static idleLength = 8;
	static cover = [Plate];
	static generate = HugeStove.generate;
	static offset = [-4, -45];
	width = 93;
	height = 101;
	stateLengthSet = [8, 12];
	stateLength = this.stateLengthSet[0];
	attackTick = [8];

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.damage = 20 + 5 * star;
		this.behaviorInterval = 3200;
		this.remainTime = this.behaviorInterval;
		this.addCost(50);
	}

	attackCheck() {
		return level?.Battlefield?.OverallFront !== null;
	}

	fire() {
		GEH.requestPlayAudio("touzhi");
		this.parent.requestSummonBullet(Boomerang, this.x + 62, this.y + 72, this.damage);
		this.parent.requestSummonBullet(Boomerang, this.x + 42, this.y + 72, this.damage);
	}

	remove() {
		this.reduceCost(50);
		super.remove();
	}
}
class CokeBomb extends Food {
	static name = "cokebomb";
	static cName = "可乐炸弹";
	static get category(): string {
		return t("C001");
	};
	static cost = 150;
	static coolTime = 50000;
	static description = "爆炸面积中等的即时炸弹";
	static upgrade = "强化后缩短[冷却时间]";
	static rarity = 1;
	static story = "谈及它的兄弟无糖可乐时，可乐炸弹的脸上闪过一丝不舍，“有人喜欢快乐，也有人追求健康——这没什么大不了的”。";
	static idleLength = 18;
	static endLength = 8;
	static offset = [-111, -86];
	width = 270;
	height = 210;
	damage = 1800;	//1800
	stateLength = 18;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
	}

	behavior() {
		if (this.tick === 12) {
			document.body.style.animation = "forwards screenMove 0.5s";
		} else if (this.tick === this.stateLength - 1) {
			this.remove();
		}
		super.behavior();
	}

	remove() {
		GEH.requestPlayAudio("pijiubao");
		const mice = level.getMiceInRange(this.row, this.column, 1, 1);
		for (let i = 0; i < mice.length; i++) {
			mice[i].getBlast(this.damage);
		}
		document.body.style.animation = "none";
		super.remove();
	}
}
class ChocolateBread extends Toast {
	static name = "chocolatebread";
	static cName = "巧克力面包";
	static cost = 125;
	static coolTime = 30000;
	static addCost = true;
	static description = "阻挡老鼠以保护身后卡片";
	static upgrade = "强化后提高[生命值]";
	static rarity = 1;
	static story = "高高的面包上巧克力绽放。";
	static offset = [-3, -24];
	tall = true;
	width = 71;
	height = 80;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.health = 6000 + star * 400;
		this.fullHealth = this.health;
		this.addCost(50);
	}

	remove() {
		this.reduceCost(50);
		super.remove();
	}
}
class CoffeePot extends BunShooter {
	static name = "coffeepot";
	static cName = "咖啡喷壶";
	static cost = 75;
	static coolTime = 7500;
	static description = "喷溅射程有限的穿透咖啡烟雾";
	static special = "日间需要休眠";
	static upgrade = "强化后提高[攻击伤害]";
	static rarity = 0;
	static story = "为什么咖啡喷壶困了不喝点咖啡呢？答案：外源咖啡因日限额。";
	static offset = [-5, -24];
	width = 78;
	height = 80;
	stateSet = ["idle", "attack", "sleep", "awake"];
	stateLengthSet = [12, 11, 10, 5];
	stateLength = this.stateLengthSet[0];
	attackTick = [9];
	sleepAnim = "/images/sleep.png";
	sleepAnimTick = 0;
	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.damage = 25 + star * 5;
		if (level.constructor.TIME !== 1) {
			this.state = this.stateSet[2];
			this.stateLength = this.stateLengthSet[2];
		}
	}

	CreateOverlayAnim() {
		super.CreateOverlayAnim();
		if (this.state === this.stateSet[2]) {
			const sleep = GEH.requestDrawImage(this.sleepAnim);
			if (sleep) {
				this.ctx.drawImage(sleep, 28 * this.sleepAnimTick, 0,
					28, 66, this.x + 56, this.y - 24, 28, 66);
				this.sleepAnimTick = (this.sleepAnimTick + 1) % 10;
			}
		}
	}
	behavior() {
		if (this.state === this.stateSet[2]) {
			this.remainTime = this.behaviorInterval;
		} else if (this.state === this.stateSet[3]) {
			this.remainTime = this.behaviorInterval;
			if (this.tick === this.stateLength - 1) {
				this.tick = 0;
				this.state = this.stateSet[0];
				this.stateLength = this.stateLengthSet[0];
			}
		}
		super.behavior();
	}

	wakeUp() {
		if (this.state === this.stateSet[2]) {
			this.tick = 0;
			this.state = this.stateSet[3];
			this.stateLength = this.stateLengthSet[3];
			return true;
		}
		return false;
	}

	attackCheck() {
		if (level.Mice[this.row] != null) {
			for (let i = this.column; i < Math.min(level.Mice[this.row].length, this.column + 5); i++) {
				if (level.Mice[this.row][i] != null && level.Mice[this.row][i].length > 0) {
					level?.createSpriteAnimation(this.x + 66, this.y + 10,
						"/images/bullets/coffeesmog.png", 10, { vertical: true });
					return true;
				}
			}
		}
		return false;
	}

	fire() {
		GEH.requestPlayAudio("kafeihu");
		if (level.Mice[this.row] != null) {
			for (let i = this.column; i < Math.min(level.Mice[this.row].length, this.column + 5); i++) {
				for (let j = 0; level.Mice[this.row][i] != null && j < level.Mice[this.row][i].length; j++) {
					if (level.Mice[this.row][i][j].attackable && level.Mice[this.row][i][j].canBeThrown) {
						level.Mice[this.row][i][j].getThrown(this.damage);
					}
				}
			}
		}
	}
}
class CatBox extends Food {
	static name = "catbox";
	static cName = "猫猫盒";
	static get category(): string {
		return t("C000");
	}
	static cost = 50;
	static description = "恫吓老鼠使其换行";
	static upgrade = "强化后提高[生命值]";
	static rarity = 1;
	static story = "猫猫盒上带有的苦味会毁掉一天的好味道。";
	static idleLength = 10;
	static assets = ["idle", "idle_critical_1", "idle_critical_2", "terrify", "terrify_critical_1", "terrify_critical_2"];
	static offset = [-25, -46];
	private readonly fullHealth: number = 0;
	get entity() {
		if (this.health <= this.fullHealth * 2 / 3) {
			if (this.health <= this.fullHealth / 3) {
				return "/images/foods/" + this.constructor.name + "/" + this.state + "_critical_2.png";
			} else {
				return "/images/foods/" + this.constructor.name + "/" + this.state + "_critical_1.png";
			}
		} else {
			return "/images/foods/" + this.constructor.name + "/" + this.state + ".png";
		}
	}

	width = 92;
	height = 102;
	stateLength = 10;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.health = 400 + star * 50;
		this.fullHealth = this.health;
	}

	CreateUnderlayAnim() {
		super.CreateUnderlayAnim(54, 27)
	}

	behavior() {
		if (this.state === "terrify") {
			if (this.tick === this.stateLength - 1) {
				this.tick = 0;
				this.state = "idle";
				this.stateLength = 10;
			}
		}
		super.behavior();
	};

	getCrashDamaged(value = 10, origin: Mouse | null = null) {
		value = Math.max(10, value);
		super.getDamaged(value);
	}

	getDamaged(value = 10, origin: Mouse | null) {
		this.getCrashDamaged(value, origin);
		const pos = Math.random() < 0.5 ? -1 : 1;
		if (origin) {
			this.terrify();
			origin.changeLine(pos, true);
		}
	}

	terrify() {
		if (this.state === "terrify") {
		} else {
			GEH.requestPlayAudio("xiadao");
			this.tick = 0;
			this.state = "terrify";
			this.stateLength = 26;
		}
	}
}
class WineRack extends BunShooter {
	static name = "winerack";
	static cName = "三线酒架";
	static cost = 325;
	static description = "向所在路及上下两路发射葡萄酒";
	static upgrade = "强化后提高[攻击伤害]";
	static rarity = 2;
	static story = "酒架酒驾，就架旧驾。";
	static idleLength = 10;
	static offset = [5, -6];
	width = 65;
	height = 61;
	stateLengthSet = [10, 10];
	stateLength = this.stateLengthSet[0];
	attackTick = [4];

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.damage = 25 + star * 5;
	}

	attackCheck() {
		// 检测上中下三行是否有老鼠
		return level.getMiceInBox(this.row - 1, this.row + 1, 0, level.column_num).length > 0;
	}

	fire() {
		GEH.requestPlayAudio("touzhi");

		this.parent.requestSummonBullet(WineBullet, this.x + 45, this.y + 28 + Math.floor(Math.random() * 5), this.damage, 0, 0);
		if (this.row > 0) {
			this.parent.requestSummonBullet(WineBullet, this.x + 45, this.y + 28 + Math.floor(Math.random() * 5), this.damage, 0, -1);
		}
		if (this.row < level.row_num - 1) {
			this.parent.requestSummonBullet(WineBullet, this.x + 45, this.y + 28 + Math.floor(Math.random() * 5), this.damage, 0, 1);
		}
	}
}
class GrilledStarfish extends BunShooter {
	static name = "grilledstarfish";
	static cName = "炭烧海星";
	static get category(): string {
		return t("C001");
	};
	static cost = 125;
	static description = "向五个触角方向发射海星";
	static upgrade = "强化后提高[攻击伤害]";
	static rarity = 1;
	static story = "“姐，你说天上的星星咋的就不会掉下来呢？”<br>“你害怕星星掉下来吗？”<br>“怕啥呢？它们那么小。”<br>“它们都很远很远，掉不下来的。”";
	static offset = [3, -22];
	width = 64;
	height = 77;
	stateLengthSet = [12, 20];
	stateLength = this.stateLengthSet[0];
	attackTick = [11];

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.damage = 20 + star * 5;
	}

	CreateUnderlayAnim(width = 80, height = 40) {
		super.CreateUnderlayAnim(width, height);
	}

	attackCheck() {
		const { Mice, row_num, column_num } = level;
		const { row, column } = this;

		if (Mice[row] && Mice[row].some((mouse: Mouse[]) => mouse && mouse.length > 0)) {
			return true;
		}

		if (Mice.some((rowMice: Mouse[][]) => rowMice && rowMice[column] && rowMice[column].length > 0)) {
			return true;
		}

		for (let i = 0; i < row_num; i++) {
			if ((row + i >= 0 && row + i < row_num && column + i >= 0 && column + i < column_num &&
				Mice[row + i] && Mice[row + i][column + i] && Mice[row + i][column + i].length > 0) ||
				(row - i >= 0 && row - i < row_num && column + i >= 0 && column + i < column_num &&
					Mice[row - i] && Mice[row - i][column + i] && Mice[row - i][column + i].length > 0)) {
				return true;
			}
		}

		return false;
	}

	fire() {
		const { row_num } = level;
		const x = this.x + 32;
		const y = this.y + 42;

		GEH.requestPlayAudio("touzhi");

		level.requestSummonBullet(Star, x, y, this.damage, 180);

		if (this.row > 0) {
			this.parent.requestSummonBullet(Star, x, y, this.damage, 270);
			this.parent.requestSummonBullet(Star, x, y, this.damage, 315);
		}

		if (this.row < row_num - 1) {
			this.parent.requestSummonBullet(Star, x, y, this.damage, 90);
			this.parent.requestSummonBullet(Star, x, y, this.damage, 45);
		}
	}
}
class RotaryCoffeePot extends Food {
	static name = "rotarycoffeepot";
	static cName = "旋转咖啡喷壶";
	static get category(): string {
		return t("C001");
	};
	static cost = 150;
	static coolTime = 50000;
	static addCost = true;
	static description = "围绕自身喷溅穿透咖啡烟雾";
	static special = "需要放置在咖啡喷壶上";
	static upgrade = "强化后提高[攻击伤害]";
	static rarity = 3;
	static story = "高自旋咖啡壶会梦见低自旋配合物吗？";
	static idleLength = 22;
	static cover = [CoffeePot];
	static generate = HugeStove.generate;
	static assets = ["attack", "awake", "idle", "sleep"];
	static offset = [-50, -52];
	width = 161;
	height = 107;
	stateSet = ["idle", "attack", "sleep", "awake"];
	stateLengthSet = [22, 22, 18, 7];
	stateLength = this.stateLengthSet[0];
	sleepAnim = "/images/sleep.png";
	sleepAnimTick = 0;
	behaviorInterval = 1200;
	remainTime = this.behaviorInterval;
	private readonly damage: number = 0;
	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.damage = 20 + star * 5;
		if (level.constructor.TIME !== 1) {
			this.state = this.stateSet[2];
			this.stateLength = this.stateLengthSet[2];
		}
		this.addCost(50);
	}

	CreateOverlayAnim() {
		super.CreateOverlayAnim();
		if (this.state === this.stateSet[2]) {
			const sleep = GEH.requestDrawImage(this.sleepAnim);
			if (sleep) {
				this.ctx.drawImage(sleep, 28 * this.sleepAnimTick, 0,
					28, 66, this.x + 88, this.y + 8, 28, 66);
				this.sleepAnimTick = (this.sleepAnimTick + 1) % 10;
			}
		}
	}
	behavior() {
		if (this.state === this.stateSet[2]) {
			this.remainTime = this.behaviorInterval;
		} else if (this.state === this.stateSet[3]) {
			this.remainTime = this.behaviorInterval;
			if (this.tick === this.stateLength - 1) {
				this.tick = 0;
				this.state = this.stateSet[0];
				this.stateLength = this.stateLengthSet[0];
			}
		} else if (this.remainTime <= 0) {
			if (this.state === this.stateSet[0]) {
				if (this.attackCheck()) {
					this.state = this.stateSet[1];
					this.stateLength = this.stateLengthSet[1];
					this.tick = 0;
				}
			} else if (this.state === this.stateSet[1]) {
				if (this.tick <= 1) {
					this.fire();
				} else if (this.tick === 10) {
					this.fire()
				} else if (this.tick === this.stateLength - 1) {
					this.tick = 0;
					this.state = this.stateSet[0];
					this.stateLength = this.stateLengthSet[0];
					this.remainTime = this.behaviorInterval;
				}
			}
		}
		super.behavior();
	}

	wakeUp() {
		if (this.state === this.stateSet[2]) {
			this.tick = 0;
			this.state = this.stateSet[3];
			this.stateLength = this.stateLengthSet[3];
			return true;
		}
		return false;
	}

	attackCheck() {
		// 检测3x3范围内是否有老鼠
		return level.getMiceInRange(this.row, this.column, 1, 1).length > 0;
	}

	fire() {
		GEH.requestPlayAudio("kafeihu");
		level?.createSpriteAnimation(this.x - 24, this.y - 54, "/images/bullets/bubble_circle.png", 12);
		const mice = level.getMiceInRange(this.row, this.column, 1, 1);
		for (let i = 0; i < mice.length; i++) {
			if (mice[i].attackable && mice[i].canBeThrown) {
				mice[i].getThrown(this.damage * 2);
			}
		}
	}

	remove() {
		this.reduceCost(50);
		super.remove();
	}
}
export class RatNest extends Food {
	static name = "ratnest";
	static get cName(): string {
		return t("AA00_CNAME");
	}
	static offset = [0, 4];
	get entity() {
		return "/images/interface/ratnest.png";
	}

	width = 65;
	height = 67;
	attackable = false;
	canShovel = false;
	stateLength = 9;

	constructor(x = 0, y = 0, type = 0) {
		super(x, y, type);
		this.initialPlant(x, y, type);
		level.Foods[y * level.column_num + x].noPlace = true;
	}

	CreateUnderlayAnim() {
		return false;
	}

	behavior() {
		this.tick = Math.min(this.tick + 1, this.stateLength - 1);
	};

	getDamaged() {
		return false;
	};

	hugeWaveHandler() {
		const mouse = new CommonMouse(this.column, this.row)
		level?.Mice[0][0].push(mouse);
		return mouse;
	}

	remove() {
		super.remove();
		level.Foods[this.row * level.column_num + this.column].noPlace = false;
	}
}
class IceBucket extends Food {
	static name = "icebucket";
	static cName = "冰桶炸弹";
	static get category(): string {
		return t("C000");
	}
	static cost = 75;
	static coolTime = 50000;
	static description = "暂时冻结所有老鼠";
	static special = "日间需要休眠";
	static upgrade = "强化后缩短[冷却时间]";
	static rarity = 0;
	static story = "双腿渐冻，灵魂歌唱。";
	static idleLength = 17;
	static endLength = 8;
	static assets = ["awake", "idle", "sleep"];
	static offset = [-215, -192];
	width = 465;
	height = 420;
	damage = 20;
	stateLength = 17;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		if (level.constructor.TIME !== 1) {
			this.state = 'sleep';
			this.stateLength = 10;
		}
	}

	behavior() {
		if (this.state === 'idle') {
			if (this.tick === 7) {
				document.body.style.animation = "forwards screenMove 0.5s";
			} else if (this.tick === this.stateLength - 1) {
				this.remove();
			}
		} else if (this.state === 'awake' && this.tick === this.stateLength - 1) {
			this.tick = 0;
			this.state = 'idle';
			this.stateLength = 17;
		}
		super.behavior();
	}

	wakeUp() {
		if (this.state === 'sleep') {
			this.tick = 0;
			this.state = 'awake';
			this.stateLength = 5;
			return true;
		}
		return false;
	}

	explode() {
		if (this.state !== 'sleep') {
			GEH.requestPlayAudio("bingdong");
			for (let i = 0; i < level.row_num + 1; i++) {
				if (level.Mice[i] != null) {
					for (let j = 0; j <= level.column_num; j++) {
						for (let k = 0; level.Mice[i][j] != null && k < level.Mice[i][j].length; k++) {
							if (level.Mice[i][j][k].attackable) {
								level.Mice[i][j][k].getFrozen();
								level.Mice[i][j][k].getFreezing();
							}
						}
					}
				}
			}
		}
		document.body.style.animation = "none";
	}

	remove() {
		this.explode();
		super.remove();
	}
}
class ChocolatePult extends BunShooter {
	static name = "chocolatepult";
	static cName = "巧克力投手";
	static assets = ["attack_0", "attack_1", "idle"];
	static cost = 100;
	static description = "投掷巧克力粒或具有定身效果的巧克力块";
	static upgrade = "强化后提高[攻击伤害]";
	static rarity = 1;
	static story = "这是一块巧克力，乖巧可爱而美丽。";
	static offset = [-27, -48];

	get entity() {
		if (this.state === 'attack') {
			if (this.attackType) {
				return "/images/foods/" + this.constructor.name + "/" + this.state + "_1.png";
			} else {
				return "/images/foods/" + this.constructor.name + "/" + this.state + "_0.png";
			}
		} else {
			return "/images/foods/" + this.constructor.name + "/" + this.state + ".png";
		}
	}

	width = 95;
	height = 104;
	stateLengthSet = [12, 7];
	attackType = 0;
	attackTick = [3];

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.damage = 45 + star * 10;
		this.behaviorInterval = 4000;
		this.remainTime = this.behaviorInterval;
	}
	attackCheck() {
		if (super.attackCheck()) {
			this.attackType = Math.floor(Math.random() * 3) % 2;
			return true;
		}
		else {
			return false;
		}
	}

	fire() {
		GEH.requestPlayAudio("touzhi");
		if (this.attackType) {
			this.parent.requestSummonBullet(Chocolate, this.x + 32, this.y + 24, this.damage, this.row);
		} else {
			this.parent.requestSummonBullet(ChocolateDot, this.x + 32, this.y + 24, Math.floor(this.damage / 2), this.row);
		}
	}
}
class SteelWool extends Food {
	static name = "steelwool";
	static cName = "钢丝球";
	static get category(): string {
		return t("C001");
	};
	static cost = 25;
	static coolTime = 30000;
	static description = "拖沉靠近它的首个老鼠";
	static special = "只能放置在水中";
	static upgrade = "强化后缩短[冷却时间]";
	static story = "每每发现钢丝仍缠在老鼠身上，它都会在叹惋之余安慰自己：“我在变秃，我在变强。”";
	static idleLength = 6;
	static assets = ["drag", "idle"];
	static offset = [-2, 4];
	static type = 2;
	static generate(x: number, y: number, star: number, skillLevel: number) {
		if (level.Foods[y * level.column_num + x].noPlace) {
			return false;
		} else if (level.Foods[y * level.column_num + x].water) {
			if (level.Foods[y * level.column_num + x].layer_1 == null) {
				if (level.Foods[y * level.column_num + x].layer_0 == null && level.Foods[y * level.column_num + x].layer_2 == null) {
					level.Foods[y * level.column_num + x].layer_1 = new this(x, y, 1, star, skillLevel);
					return true;
				} else {
					return false;
				}
			} else {
				return false;
			}
		} else {
			return false;
		}
	};
	width = 72;
	height = 141;
	target: Mouse | null = null;
	stateLength = 6;

	dragAnim = "/images/foods/steelwool/drag.png";
	dragAnimTick = 0;

	ripple = "/images/ripple.png";
	rippleTick = 0;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
	}

	attackCheck() {
		if (level.Mice[this.row] != null && level.Mice[this.row][this.column] != null) {
			for (let i = 0; i < level.Mice[this.row][this.column].length + 1; i++) {
				const mouse = level.Mice[this.row][this.column][i] as Mouse;
				if (mouse && mouse.attackable && !mouse.fly) {
					mouse.haltedLength = Infinity;
					this.target = mouse;
					return true;
				}
			}
		}
		return false;
	}

	behavior() {
		if (this.target == null) {
			this.attackCheck();
		} else {
			if (this.dragAnimTick === 6) {
				this.target.remove();
				this.remove();
			}
			const drag = GEH.requestDrawImage(this.dragAnim);
			if (drag) {
				this.ctx.drawImage(drag, 82 * this.rippleTick, 0, 82, 42,
					level.column_start + this.target.positionX * level.row_gap - 18,
					level.row_start + this.target.row * level.column_gap + 16, 82, 42);
				this.dragAnimTick = this.dragAnimTick + 1;
			}
			this.y = this.y + 1;
			this.target.y = this.target.y + 1;
		}
		const ripple = GEH.requestDrawImage(this.ripple);
		if (ripple) {
			this.ctx.drawImage(ripple, 72 * this.rippleTick, 0, 72, 39,
				this.column * level.row_gap + level.column_start - (this.width / 2 - level.row_gap / 2) + 2, this.row * level.column_gap + level.row_start - this.height / 2 + 94, 72, 39);
			this.rippleTick = (this.rippleTick + 1) % 4;
		}
		super.behavior();
	}
}
class TeaCup extends CoffeeCup {
	static name = "teacup";
	static cName = "水上茶杯";
	static cost = 0;
	static coolTime = 30000;
	static description = "发射射程有限的咖啡泡";
	static special = "水生，日间需要休眠";
	static upgrade = "强化后提高[攻击伤害]";
	static story = "浮一生，会四季。";
	static idleLength = 8;
	static offset = [4, 6];
	static type = 3;
	static generate = SteelWool.generate;
	width = 56;
	height = 58;
	stateSet = ["idle", "attack", "sleep"];
	stateLengthSet = [8, 7, 8];
	stateLength = this.stateLengthSet[0];
	ripple = "/images/ripple.png";
	rippleTick = 0;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.damage = 20 + star * 5;
	}

	CreateOverlayAnim() {
		if (this.state === this.stateSet[2]) {
			const sleep = GEH.requestDrawImage(this.sleepAnim);
			if (sleep) {
				this.ctx.drawImage(sleep, 28 * this.sleepAnimTick, 0,
					28, 66, this.x + 30, this.y - 30, 28, 66);
				this.sleepAnimTick = (this.sleepAnimTick + 1) % 10;
			}
		}
	}

	behavior() {
		const ripple = GEH.requestDrawImage(this.ripple);
		if (ripple) {
			this.ctx.drawImage(ripple, 72 * this.rippleTick, 0, 72, 39,
				this.column * level.row_gap + level.column_start - (this.width / 2 - level.row_gap / 2) - 6,
				this.row * level.column_gap + level.row_start - this.height / 2 + 56, 72, 39);
			this.rippleTick = (this.rippleTick + 1) % 4;
		}
		super.behavior();
	}
}
class EggPult extends BunShooter {
	static name = "eggpult";
	static cName = "煮蛋器投手";
	static cost = 250;
	static description = "投掷对目标及其周围敌人造成伤害的鸡蛋";
	static upgrade = "强化后提高[攻击伤害]";
	static rarity = 2;
	static story = "我日日夜夜东奔西忙，干个不停，人人都对我很尊敬；我是美味镇里的大忙人，人人都离不开我煮鸡蛋。";
	static idleLength = 14;
	static offset = [-37, -72];
	width = 107;
	height = 128;
	stateLengthSet = [14, 12];
	behaviorInterval = 4000;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.damage = 80 + star * 24;
	}

	fire() {
		GEH.requestPlayAudio("touzhi");
		this.parent.requestSummonBullet(Egg, this.x + 24, this.y + 48, this.damage, this.row);
	}
}
class Sausage extends BunShooter {
	static name = "sausage";
	static cName = "香肠射手";
	static cost = 125;
	static description = "发射可以攻击空中敌人的香肠";
	static upgrade = "强化后提高[攻击伤害]";
	static rarity = 1;
	static story = "做剧烈运动之前一定要拉伸——香肠射手在这方面大有建树，它甚至获得了康复运动的博士学位。";
	static assets = ["attack", "attack_1", "idle"];
	static offset = [5, -74];
	get entity() {
		if (this.state === this.stateSet[1]) {
			if (this.attackMode) {
				return "/images/foods/" + this.constructor.name + "/" + this.state + '_1' + ".png";
			} else {
				return "/images/foods/" + this.constructor.name + "/" + this.state + ".png";
			}
		} else {
			return "/images/foods/" + this.constructor.name + "/" + this.state + ".png";
		}
	}

	width = 65;
	height = 127;
	stateLengthSet = [12, 6, 19];
	attackMode = false;
	attackTick = [5];
	attackTick_1 = [11];

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.damage = 25 + star * 5;
	}

	CreateUnderlayAnim(width = 54, height = 27) {
		super.CreateUnderlayAnim(width, height);
	}

	behavior() {
		if (this.remainTime <= 0) {
			if (this.state === this.stateSet[0]) {
				if (this.attackCheck()) {
					this.state = this.stateSet[1];
					if (this.attackMode) {
						GEH.requestPlayAudio('jiubeideng');
						this.stateLength = this.stateLengthSet[2];
					} else {
						this.stateLength = this.stateLengthSet[1];
					}
					this.tick = 0;
				}
			} else if (this.state === this.stateSet[1]) {
				if (this.attackMode) {
					if (this.attackTick_1.includes(this.tick)) {
						this.fire();
					}
				} else {
					if (this.attackTick.includes(this.tick)) {
						this.fire();
					}
				}
				if (this.tick === this.stateLength - 1) {
					this.tick = 0;
					this.state = this.stateSet[0];
					this.stateLength = this.stateLengthSet[0];
					this.remainTime = this.behaviorInterval;
				}
			}
		}
		this.tick = (this.tick + 1) % this.stateLength;
	}

	attackCheck() {
		if (level.AirLane[this.row] != null) {
			for (let i = 0; i < level.AirLane[this.row].length; i++) {
				if (level.AirLane[this.row][i] != null && level.AirLane[this.row][i].length > 0) {
					this.attackMode = true;
					return true;
				}
			}
		} else if (level.Mice[this.row] != null) {
			for (let i = 0; i < level.Mice[this.row].length; i++) {
				if (level.Mice[this.row][i] != null && level.Mice[this.row][i].length > 0) {
					this.attackMode = false;
					return true;
				}
			}
		}
		return false;
	}

	fire() {
		GEH.requestPlayAudio("zidan");
		if (this.attackMode) {
			this.parent.requestSummonBullet(SausageAir, this.x + 54, this.y + 38 + Math.floor(Math.random() * 8), this.damage, this.row)
		} else {
			this.parent.requestSummonBullet(SausageLand, this.x + 54, this.y + 94 + Math.floor(Math.random() * 5), this.damage);
		}
	}
}
class FishBone extends Food {
	static name = "fishbone";
	static cName = "鱼刺";
	static get category(): string {
		return t("C001");
	};
	static cost = 100;
	static description = "穿透攻击践踏其上的敌人";
	static upgrade = "强化后提高[攻击伤害]";
	static story = "我有206+1根骨头——那根是卡在喉咙里的鱼骨。";
	static generate = RatClip.generate;
	static assets = ["attack", "idle"];
	static offset = [3, 32];
	short = true;
	width = 62;
	height = 21;
	stateLength = 12;
	protected damage: number = 0;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.damage = 25 + star * 5;
	}

	behavior() {
		if (this.state === 'idle') {
			if (this.attackCheck()) {
				this.attack();
				this.tick = 0;
				this.stateLength = 7;
				this.state = 'attack';
			}
		} else if (this.state === 'attack') {
			if (this.tick === this.stateLength - 1) {
				if (this.attackCheck()) {
					this.attack();
				} else {
					this.tick = 0;
					this.state = 'idle';
					this.stateLength = 12;
				}
			}
		}
		super.behavior();
	}

	attackCheck() {
		if (level.Foods[this.column + this.row * level.column_num].layer_0 == null) {
			if (level.Mice[this.row] != null) {
				if (level.Mice[this.row][this.column] != null) {
					for (let i = 0; i < level.Mice[this.row][this.column].length; i++) {
						if (level.Mice[this.row][this.column][i].attackable
							&& !level.Mice[this.row][this.column][i].fly
							&& (level.Mice[this.row][this.column][i].canBeHit
								|| level.Mice[this.row][this.column][i].canBeThrown)) {
							return true;
						}
					}
				}
				if (level.Mice[this.row][this.column - 1] != null) {
					for (let i = 0; i < level.Mice[this.row][this.column - 1].length; i++) {
						if (level.Mice[this.row][this.column - 1][i].positionX >= this.column - 0.2
							&& level.Mice[this.row][this.column - 1][i].attackable
							&& !level.Mice[this.row][this.column - 1][i].fly
							&& (level.Mice[this.row][this.column - 1][i].canBeHit
								|| level.Mice[this.row][this.column - 1][i].canBeThrown)) {
							return true;
						}
					}
				}
			}
		}
		return false;
	}

	attack() {
		GEH.requestPlayAudio('touzhi');
		if (level.Mice[this.row] != null) {
			if (level.Mice[this.row][this.column] != null) {
				for (let i = 0; i < level.Mice[this.row][this.column].length; i++) {
					if (level.Mice[this.row][this.column][i].attackable
						&& !level.Mice[this.row][this.column][i].fly) {
						level.Mice[this.row][this.column][i].getThrown(this.damage);
					}
				}
			}
			if (level.Mice[this.row][this.column - 1] != null) {
				for (let i = 0; i < level.Mice[this.row][this.column - 1].length; i++) {
					if (level.Mice[this.row][this.column - 1][i].positionX >= this.column - 0.2
						&& level.Mice[this.row][this.column - 1][i].attackable
						&& !level.Mice[this.row][this.column - 1][i].fly) {
						level.Mice[this.row][this.column - 1][i].getThrown(this.damage);
					}
				}
			}
		}
	}

	getCrashDamaged(value = 10, origin: Mouse | null = null) {
		if (origin) {
			switch (origin.name) {
				case 'mobilemachineryshop':
				case 'rubbishtruck': {
					origin.die();
				}
			}
		}
		super.getCrashDamaged(value, origin);
	}
}
class Hamburger extends Food {
	static name = "hamburger";
	static cName = "汉堡包";
	static get category(): string {
		return t("C001");
	};
	static cost = 150;
	static description = "吞噬前方老鼠";
	static upgrade = "强化后缩短[吞噬间隔]";
	static rarity = 1;
	static story = "-请问是派大星吗？<br>-不是，我是蟹堡王。";
	static assets = ["attack", "digest", "idle", "swallow"];
	static offset = [-13, -54];
	width = 147;
	height = 114;
	behaviorInterval = 40000;
	stateSet = ['idle', 'attack', 'digest', 'swallow'];
	stateLengthSet = [12, 16, 12, 10];
	stateLength = this.stateLengthSet[0];
	remainTime = 0;
	damage = 1800;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.behaviorInterval = 40000 - star * 2500;
	}

	CreateUnderlayAnim(width = 72, height = 36) {
		const shadow = GEH.requestDrawImage(Food.SHADOW_IMAGE);
		if (shadow) {
			const left = (this.state === "attack" && this.tick >= 3 && this.tick <= 12) ?
				(this.tick > 5 ? 3 : (this.tick > 9 ? (13 - this.tick) : (this.tick - 2))) * 15 : 0;

			this.ctx.drawImage(shadow,
				(this.column + 0.5) * level.row_gap + level.column_start - 72 / 2 + left + 4,
				(this.row + 1) * level.column_gap + level.row_start - 36, 72, 36);
		}
	}

	behavior() {
		if (this.state === this.stateSet[0]) {
			if (this.attackCheck()) {
				this.tick = 0;
				this.state = this.stateSet[1];
				this.stateLength = this.stateLengthSet[1];
			}
		} else if (this.state === this.stateSet[1]) {
			if (this.tick === 5) {
				GEH.requestPlayAudio("hanbao");
				if (this.attack()) {

				} else {
					this.tick = 0;
					this.state = this.stateSet[0];
					this.stateLength = this.stateLengthSet[0];
				}
			}
			if (this.tick === this.stateLength - 1) {
				this.tick = 0;
				this.state = this.stateSet[2];
				this.stateLength = this.stateLengthSet[2];
				this.remainTime = this.behaviorInterval;
			}
		} else if (this.state === this.stateSet[2]) {
			if (this.remainTime <= 0) {
				this.tick = 0;
				this.state = this.stateSet[3];
				this.stateLength = this.stateLengthSet[3];
			}
		} else if (this.state === this.stateSet[3]) {
			if (this.tick === this.stateLength - 1) {
				this.tick = 0;
				this.state = this.stateSet[0];
				this.stateLength = this.stateLengthSet[0];
			}
		}
		super.behavior();
	}

	attackCheck() {
		if (level.Mice[this.row] != null) {
			if (level.Mice[this.row][this.column] != null) {
				for (let i = 0; i < level.Mice[this.row][this.column].length; i++) {
					const mouse = level.Mice[this.row][this.column][i];
					if (mouse.attackable
						&& !mouse.fly
						&& (mouse.canBeHit || mouse.canBeThrown)) {
						return true;
					}
				}
			}
			if (level.Mice[this.row][this.column + 1] != null) {
				for (let i = 0; i < level.Mice[this.row][this.column + 1].length; i++) {
					const mouse = level.Mice[this.row][this.column + 1][i];
					if (mouse.positionX >= this.column - 0.2
						&& mouse.attackable
						&& !mouse.fly
						&& (mouse.canBeHit || mouse.canBeThrown)) {
						return true;
					}
				}
			}
		}
		return false;
	}

	attack() {
		if (level.Mice[this.row] != null) {
			if (level.Mice[this.row][this.column] != null) {
				for (let i = 0; i < level.Mice[this.row][this.column].length; i++) {
					const mouse = level.Mice[this.row][this.column][i];
					if (mouse.attackable
						&& !mouse.fly
						&& (mouse.canBeHit || mouse.canBeThrown)) {
						mouse.getDamaged(this.damage);
						if (mouse.health <= 0) {
							mouse.remove();
						}
						return true;
					}
				}
			}
			if (level.Mice[this.row][this.column + 1] != null) {
				for (let i = 0; i < level.Mice[this.row][this.column + 1].length; i++) {
					const mouse = level.Mice[this.row][this.column + 1][i];
					if (mouse.positionX >= this.column - 0.2
						&& mouse.attackable
						&& !mouse.fly
						&& (mouse.canBeHit || mouse.canBeThrown)) {
						mouse.getDamaged(this.damage);
						if (mouse.health <= 0) {
							mouse.remove();
						}
						return true;
					}
				}
			}
		}
		return false;
	}
}
class OilLamp extends Food {
	static name = "oillamp";
	static cName = "油灯";
	static get category(): string {
		return t("C000");
	}
	static cost = 25;
	static coolTime = 30000;
	static description = "照亮大范围迷雾";
	static upgrade = "强化后提高[生命值]";
	static story = "Winston? We shall meet in the place where there is no darkness.";
	static offset = [-41, -90];
	width = 145;
	height = 145;
	stateLength = 12;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.health = 300 + star * 100;
		for (let i = -2; i <= 2; i++) {
			if (this.row + i >= 0 && this.row + i < level.row_num) {
				for (let j = -2; j <= 2; j++) {
					if (this.column + j >= 0 && this.column + j < (level.column_num + 1)) {
						let DEG = 2;
						if (i === -2 || i === 2) {
							DEG--;
						}
						if (j === -2 || j === 2) {
							DEG--;
						}
						level.lightDEGChange((this.row + i) * (level.column_num + 1) + (this.column + j), DEG);
					}
				}
			}
		}
	}
	CreateUnderlayAnim(width = 54, height = 27) {
		super.CreateUnderlayAnim(width, height);
	}
	remove() {
		for (let i = -2; i <= 2; i++) {
			if (this.row + i >= 0 && this.row + i < level.row_num) {
				for (let j = -2; j <= 2; j++) {
					if (this.column + j >= 0 && this.column + j < (level.column_num + 1)) {
						let DEG = 2;
						if (i === -2 || i === 2) {
							DEG--;
						}
						if (j === -2 || j === 2) {
							DEG--;
						}
						level.lightDEGChange((this.row + i) * (level.column_num + 1) + (this.column + j), - DEG);
					}
				}
			}
		}
		super.remove();
	}
}
class Fan extends Food {
	static name = "fan";
	static cName = "换气扇";
	static get category(): string {
		return t("C000");
	}
	static cost = 100;
	static description = "驱散迷雾和空域老鼠";
	static upgrade = "强化后延长[驱散时间]";
	static rarity = 1;
	static story = "O bella ciao, bella ciao, bella ciao ciao ciao。";
	static idleLength = 5;
	static assets = ["blow", "idle"];
	static offset = [1, -32];
	width = 79;
	height = 86;
	stateLength = 5;
	circleTimes = 3;
	duration = 15000;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.duration = 15000 + star * 1000;
	}

	CreateUnderlayAnim(width = 54, height = 27) {
		super.CreateUnderlayAnim(width, height);
	}

	behavior() {
		if (this.state === 'idle') {
			if (this.tick === this.stateLength - 1) {
				this.state = 'blow';
				this.stateLength = 7;
			}
		} else if (this.state === 'blow') {
			if (this.tick === this.stateLength - 1) {
				this.circleTimes--;
				if (this.circleTimes <= 0) {
					this.remove();
				}
			}
		}
		super.behavior();
	}

	remove() {
		level.fogBlowAway(this.duration);
		for (let i = 0; i < level.row_num; i++) {
			if (level.AirLane[i] != null) {
				for (let j = 0; j <= level.column_num; j++) {
					if (level.AirLane[i][j] != null) {
						for (let k = 0; k < level.AirLane[i][j].length; k++) {
							if (level.AirLane[i][j][k].name === 'glidingmouse') {
								level.AirLane[i][j][k].remove();
							}
						}
					}
				}
			}
		}
		super.remove();
	}
}
class SnowEggPult extends EggPult {
	static name = "snoweggpult";
	static cName = "冰煮蛋器投手";
	static cost = 200;
	static coolTime = 50000;
	static description = "投掷对目标及其周围敌人造成伤害并减速的冰鸡蛋";
	static addCost = true;
	static special = "需要放置在煮蛋器上";
	static upgrade = "强化后提高[攻击伤害]";
	static rarity = 3;
	static story = "早上好世界，现在我有冰...鸡蛋。";
	static idleLength = 14;
	static cover = [EggPult];
	static generate = HugeStove.generate;
	static offset = [-37, -68];
	width = 110;
	height = 123;
	behaviorInterval = 4000;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.damage = 80 + star * 24;
		this.addCost(50);
	}

	fire() {
		GEH.requestPlayAudio("touzhi");
		this.parent.requestSummonBullet(SnowEgg, this.x + 24, this.y + 48, this.damage, this.row);
	}

	remove() {
		this.reduceCost(50);
		super.remove();
	}
}
class GatlingBunShooter extends BunShooter {
	static name = "gatlingbunshooter";
	static cName = "机枪笼包射手";
	static cost = 250;
	static coolTime = 50000;
	static description = "发射四发包子";
	static addCost = true;
	static special = "需要放置在双层笼包上";
	static upgrade = "强化后提高[攻击伤害]";
	static rarity = 3;
	static story = "物质力量只能由物质力量来摧毁。";
	static cover = [DoubleBunShooter];
	static generate = HugeStove.generate;
	static offset = [5, -22];
	width = 71;
	height = 75;
	stateLengthSet = [12, 11];
	attackTick = [2, 4, 6, 8];

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.damage = 25 + star * 5;
		this.behaviorInterval = 2000;
		this.addCost(50);
	}

	fire() {
		GEH.requestPlayAudio("zidan");
		this.parent.requestSummonBullet(Bun, this.x + 64, this.y + 34 + Math.floor(Math.random() * 5), this.damage, 0);
	}

	remove() {
		this.reduceCost(50);
		super.remove();
	}
}
class SteelFishBone extends FishBone {
	static name = "steelfishbone";
	static cName = "钢鱼刺";
	static cost = 125;
	static coolTime = 50000;
	static description = "穿透攻击践踏其上的敌人";
	static addCost = true;
	static special = "需要放置在鱼刺上";
	static upgrade = "强化后提高[攻击伤害]";
	static rarity = 3;
	static story = "便条上写着：“从来没有人考虑过鱼刺卡到脚里应该怎么处理吗？”";
	static cover = [FishBone];
	static generate = HugeStove.generate;
	static offset = [0, 20];
	width = 67;
	height = 32;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.damage = 50 + star * 12;
		this.addCost(50);
	}

	getCrashDamaged(value = 10, origin = null) {
		value = Math.min(value, 100);
		super.getCrashDamaged(value, origin);
	}

	remove() {
		this.reduceCost(50);
		super.remove();
	}
}
class KettleBomb extends IceBucket {
	static name = "kettlebomb";
	static cName = "开水壶炸弹";
	static get category(): string {
		return t("C001");
	};
	static cost = 275;
	static coolTime = 50000;
	static description = "爆炸面积巨大的即时炸弹";
	static special = "日间需要休眠";
	static upgrade = "强化后缩短[冷却时间]";
	static rarity = 2;
	static story = "多喝开水，或者让开水壶来灌。";
	static idleLength = 23;
	static endLength = 8;
	static offset = [-85, -148];
	width = 240;
	height = 210;
	damage = 1800;
	stateLength = 23;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		if (level.constructor.TIME !== 1) {
			this.stateLength = 10;
		}
	}

	behavior() {
		if (this.state === 'idle') {
			if (this.tick === 9) {
				document.body.style.animation = "forwards screenMove 0.5s";
			} else if (this.tick === this.stateLength - 1) {
				this.remove();
			}
		} else if (this.state === 'awake' && this.tick === this.stateLength - 1) {
			this.tick = 0;
			this.state = 'idle';
			this.stateLength = 23;
		}
		super.behavior();
	}

	wakeUp() {
		if (this.state === 'sleep') {
			this.tick = 0;
			this.state = 'awake';
			this.stateLength = 3;
			return true;
		}
		return false;
	}

	explode() {
		if (this.state !== 'sleep') {
			GEH.requestPlayAudio("zhongjibao");
			for (let i = Math.max(this.row - 2, 0); i < Math.min(level.row_num, this.row + 3); i++) {
				if (level.Mice[i] != null) {
					for (let j = Math.max(this.column - 2); j <= Math.min(level.column_num, this.column + 2); j++) {
						for (let k = 0; level.Mice[i][j] != null && k < level.Mice[i][j].length; k++) {
							if (level.Mice[i][j][k].attackable) {
								level.Mice[i][j][k].getBlast(this.damage);
							}
						}
					}
				}
			}
		}
		document.body.style.animation = "none";
	}
}
class WineBottle extends Food {
	static name = "winebottle";
	static cName = "酒瓶炸弹";
	static get category(): string {
		return t("C001");
	};
	static cost = 125;
	static coolTime = 50000;
	static description = "单行爆炸的即时炸弹";
	static upgrade = "强化后缩短[冷却时间]";
	static rarity = 1;
	static story = "可曾闲来愁沽酒，偶尔相对饮几盅。";
	static idleLength = 9;
	static endLength = 8;
	static offset = [13, -20];
	width = 40;
	height = 75;
	damage = 1800;
	stateLength = 20;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
	}

	CreateUnderlayAnim(width = 54, height = 27) {
		super.CreateUnderlayAnim(width, height);
	}

	behavior() {
		if (this.tick === 9) {
			document.body.style.animation = "forwards screenMove 0.5s";
			GEH.requestPlayAudio("pijiubao");
		} else if (this.tick > 9) {
			const offset = this.tick - 9;
			if (this.column + offset <= level.column_num + 1) {
				level?.createSpriteAnimation(
					level.column_start + (this.column + offset - 1) * level.row_gap - 2,
					level.row_start + (this.row) * level.column_gap - 48,
					"/images/bullets/flame.png", 7);
			}
			if (this.column - offset >= 0) {
				level?.createSpriteAnimation(
					level.column_start + (this.column - offset) * level.row_gap - 2,
					level.row_start + (this.row) * level.column_gap - 48,
					"/images/bullets/flame.png", 7);
			}
			if ((this.column + offset > level.column_num + 1 && this.column - offset < 0) || this.tick === this.stateLength - 1) {
				this.remove();
			}
		}
		super.behavior();
	}

	remove() {
		if (level.Mice[this.row] != null) {
			for (let j = 0; j <= level.column_num; j++) {
				for (let k = 0; level.Mice[this.row][j] != null && k < level.Mice[this.row][j].length; k++) {
					if (level.Mice[this.row][j][k].attackable) {
						level.Mice[this.row][j][k].getBlast(this.damage);
					}
				}
			}
		}

		document.body.style.animation = "none";
		super.remove();
	}
}
class ChocolateCannon extends Food {
	static name = "chocolatecannon";
	static cName = "巧克力加农炮";
	static get category(): string {
		return t("C001");
	};
	static cost = 125;
	static coolTime = 50000;
	static description = "定时发射巧克力炮弹";
	static upgrade = "强化后减少[就绪耗时]";
	static rarity = 3;
	static story = "Yes, and how many times must the cannonballs fly, before they're forever banned.";
	static idleLength = 10;
	static cover = [ChocolatePult];
	static generate = HugeStove.generate;
	static assets = ["attack", "idle"];
	static offset = [-8, -32];
	width = 84;
	height = 85;
	damage = 1800;
	stateLength = 10;
	stateLengthSet = [10];
	behaviorInterval: number = 0;
	remainTime: number = 0;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.behaviorInterval = 35000 - star * 2125;
		this.remainTime = this.behaviorInterval;
	}

	behavior() {
		if (this.remainTime <= 0) {
			if (this.state === 'idle') {
				this.state = 'attack';
				this.tick = 0;
			} else if (this.state === 'attack') {
				if (this.tick === this.stateLength - 1) {
					this.state = 'idle';
					this.tick = 0;
					this.fire();
					this.remainTime = this.behaviorInterval;
				}
			}
		}
		super.behavior();
	}

	fire() {
		level?.createSpriteAnimation(level.column_start + 8 * level.row_gap - 72,
			level.row_start + this.row * level.column_gap - 72,
			"/images/bullets/cannonball.png", 12,
			{
				func: () => {
					GEH.requestPlayAudio("pijiubao");
					for (let i = this.row - 1; i <= this.row + 1; i++) {
						if (level.Mice[i] != null) {
							for (let j = 8 - 1; j <= 8 + 1; j++) {
								for (let k = 0; level.Mice[i][j] != null && k < level.Mice[i][j].length; k++) {
									level.Mice[i][j][k].getBlast(this.damage);
								}
							}
						}
					}
				}
			});
	}
}
class AirDefenseShell extends Food {
	static name = "airdefenseshell";
	static cName = "防空贝壳";
	static get category(): string {
		return t("C000");
	}
	static cost = 100;
	static description = "保护附近防御卡免受空降威胁";
	static upgrade = "强化后提高[生命值]";
	static rarity = 1;
	static story = "-Say Geronimo!<br>-Bounce away!";
	static idleLength = 10;
	static assets = ["defend", "idle"];
	static offset = [-47, -54];
	width = 177;
	height = 174;
	stateLength = 10;
	airDefense = true;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
	}

	behavior() {
		if (this.state === 'defend') {
			if (this.tick === this.stateLength - 1) {
				this.tick = 0;
				this.state = 'idle';
				this.stateLength = 10;
			}
		}
		super.behavior();
	}

	defend() {
		if (this.state === 'defend') {

		} else {
			this.tick = 0;
			this.state = 'defend';
			this.stateLength = 4;
		}
	}
}
export class TubeIn extends Food {
	static name = "tubein";
	static get cName(): string {
		return t("AA01_CNAME");
	}
	static offset = [-12, 16];
	width = 91;
	height = 62;
	attackable = false;
	canShovel = false;
	stateLength = 16;
	forward = 1;
	line = 1;

	get entity() {
		return "/images/interface/tube_0.png";
	}

	constructor(x = 0, y = 0, type = 0) {
		super(x, y, type);
		this.initialPlant(x, y, type);
		level.Foods[y * level.column_num + x].noPlace = true;
	}

	CreateUnderlayAnim() {
		return false;
	}

	behavior() {
		this.tick = Math.min(this.tick + 1, this.stateLength - 1);
		if (level.Mice[this.row] != null && level.Mice[this.row][this.column] != null) {
			for (let i = 0; i < level.Mice[this.row][this.column].length; i++) {
				if (level.Mice[this.row][this.column][i].speed > 0
					&& level.Mice[this.row][this.column][i].Movable) {
					level.Mice[this.row][this.column][i].x -= this.forward * 60;
					level.Mice[this.row][this.column][i].changeLine(this.line, false);
				}
			}
		}
	}

	getDamaged() {
		return false;
	}

	remove() {
		level.Foods[this.row * level.column_num + this.column].noPlace = false;
		super.remove();
	}
}
export const FoodDetails = new Map<number, Food | any>([
	[0, Stove],
	[1, BunShooter],
	[2, Toast],
	[3, FlourSack],
	[4, SnowBunShooter],
	[5, SaladPult],
	[6, RatClip],
	[7, Pudding],
	[8, WatermelonRind],
	[9, Plate],
	[10, WaterPipe],
	[11, DoubleBunShooter],
	[12, Brazier],
	[13, WineGlass],
	[14, CoffeeCup],
	[15, HugeStove],
	[16, Takoyaki],
	[17, CokeBomb],
	[18, ChocolateBread],
	[19, CoffeePot],
	[20, CatBox],
	[21, WineRack],
	[22, {
		name: `icecream`,
		cName: `冰淇淋`,
		category: `辅助型`,
		cost: 100,
		coolTime: 60000,
		offset: [-20, -60],
		description: "种植在卡片上，使其立即冷却完毕",
		upgrade: "强化后缩短[冷却时间]",
		rarity: 1,
		story: "五卷，赢了去睡觉，输了去学习。",
		assets: ["idle"],
		idleLength: 16,
		generate: (function (x: number, y: number, star: number, skillLevel: number) {
			return specialGenerate(x, y, star, skillLevel, 0);
		})
	}],
	[23, {
		name: `groundcoffee`,
		cName: "咖啡粉",
		category: `辅助型`,
		cost: 75,
		coolTime: 7500,
		offset: [-10, -40],
		description: "种植在休眠的卡片上，将其唤醒",
		upgrade: "强化后提升[等级标识]",
		rarity: 1,
		story: "零落成泥碾作尘，只有香如故。",
		assets: ["idle"],
		idleLength: 13,
		endLength: 4,
		generate: (function (x: number, y: number, star: number, skillLevel: number) {
			return specialGenerate(x, y, star, skillLevel, 1);
		})
	}],
	[24, GrilledStarfish],
	[25, RotaryCoffeePot],
	[26, {
		name: `cork`,
		cName: "软木塞",
		get category() { return t("C000"); },
		cost: 75,
		coolTime: 7500,
		offset: [-2, -20],
		description: "填充鼠洞以阻止老鼠钻出",
		special: "只能放置在鼠洞上",
		upgrade: "强化后提升[等级标识]",
		rarity: 0,
		story: "一无可进的进口，一无可去的去处。",
		idleLength: 40,
		endLength: 2,
		generate: (function (x: number, y: number, star: number, skillLevel: number) {
			if (level.Foods[y * level.column_num + x] == null
				|| level.Foods[y * level.column_num + x].layer_1 == null
				|| level.Foods[y * level.column_num + x].layer_1.constructor !== RatNest) {
				return false;
			} else {
				return specialGenerate(x, y, star, skillLevel, 2);
			}
		})
	}],
	[27, IceBucket],
	[28, ChocolatePult],
	[29, EggPult],
	[30, SteelWool],
	[31, TeaCup],
	[32, Sausage],
	[33, FishBone],
	[34, OilLamp],
	[35, Hamburger],
	[36, Fan],
	[37, SnowEggPult],
	[38, GatlingBunShooter],
	[39, SteelFishBone],
	[40, KettleBomb],
	[41, WineBottle],
	[42, ChocolateCannon],
	[43, AirDefenseShell],
	[44, {
		name: `marshmallow`,
		cName: "棉花糖",
		offset: [-6, -6],
		get category() { return t("C000"); },
		cost: 25,
		coolTime: 7500,
		description: "填补云洞或是在岩浆上承载卡片",
		upgrade: "强化后提高[生命值]",
		rarity: 0,
		story: "埏埴以为器，当其无，有器之用。凿户牖以为室，当其无，有室之用。故有之以为利，无之以为用。",
		idleLength: 8,
		generate: (function (x: number, y: number, star: number, skillLevel: number) {
			level.Battlefield.playPlantAnimation(0, x, y);
			if (level.Foods[y * level.column_num + x] && level.Foods[y * level.column_num + x].lava) {

			} else if (level && level.cloudCavityPosition) {
				for (let i = 0; i < level.cloudCavityPosition.length; i++) {
					if (level.cloudCavityPosition[i].row === y
						&& Math.abs(level.cloudCavityPosition[i].column - x) <= 1) {
						level.cloudCavityPosition[i].cavity = false;
						break;
					}
				}
			}
			return true;
		})
	}],
]);
export const getFoodDetails = function (type: number) {
	if (FoodDetails.has(type)) {
		return FoodDetails.get(type);
	}
	else {
		return Food;
	}
}