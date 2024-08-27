class FennelRaft extends Level {
    static name = "茴香竹筏";
    mapAnim = "../static/images/interface/raft.png";
    moveTime = 0;
	constructor() {
		super(3);
		this.StartWaveCreate();
	}

	StartWaveCreate() {
		this.waveCreate(0, 1, 1);
		this.GetAssets();
	}

	Enter() {
		GEH.requestBackMusicChange(17);

		for (let i = 0; i < EventHandler.level.row_num * EventHandler.level.column_num; i++) {
			this.Foods[i] = new MapGrid();
		}

		for (let i = 1; i < 5; i++) {
			this.Foods[i + 4].noPlace = true;
			this.Foods[9 + i + 4].noPlace = true;
			this.Foods[i + 45].noPlace = true;
			this.Foods[i + 54].noPlace = true;
		}
        this.setGuardian();
	}
    victory() {
        return false;
    }

    mapMove() {
        const anim = GEH.requestImageCache(this.mapAnim);
        if(anim){
            this.BattleBackground.Canvas.getContext('2d').drawImage(anim, EventHandler.level.column_start + 62, EventHandler.level.row_start);
            this.BattleBackground.Canvas.getContext('2d').drawImage(anim, EventHandler.level.column_end - 60 * 4, EventHandler.level.row_start + EventHandler.level.row_gap * 2);
        }

        this.moveTime = (this.moveTime + 4) % (1281);
        if (this.moveTime <= 400) {
        } else if ((this.moveTime > 400 && this.moveTime <= 640)) {
            for (let i = EventHandler.level.row_num - 1; i >= 0; i--) {
                for (let j = 0; j < 4; j++) {
                    if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_1 != null) {
                        this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.y =
                            ((i * EventHandler.level.column_gap + EventHandler.level.row_start - this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.height / 2)
                                + (this.moveTime - 400) % 121 / 2);
                    }
                    if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_0 != null) {
                        this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.y =
                            ((i * EventHandler.level.column_gap + EventHandler.level.row_start - this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.height / 2)
                                + (this.moveTime - 400) % 121 / 2);
                    }
                }

                for (let j = 4; j < 8; j++) {
                    if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_1 != null) {
                        this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.y =
                            ((i * EventHandler.level.column_gap + EventHandler.level.row_start - this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.height / 2)
                                - (this.moveTime - 400) % 121 / 2);
                    }
                    if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_0 != null) {
                        this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.y =
                            ((i * EventHandler.level.column_gap + EventHandler.level.row_start - this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.height / 2)
                                - (this.moveTime - 400) % 121 / 2);
                    }
                }
            }

            if (this.moveTime === 520 || this.moveTime === 640) {
                for (let i = EventHandler.level.row_num - 1; i >= 0; i--) {
                    for (let j = 0; j < 4; j++) {
                        if (i === 0) {
                            this.Foods[1 + i * EventHandler.level.column_num + j] = new MapGrid();
                            this.Foods[1 + i * EventHandler.level.column_num + j].noPlace = true;
                            continue;
                        }

                        this.Foods[1 + i * EventHandler.level.column_num + j] = this.Foods[1 + (i - 1) * EventHandler.level.column_num + j];

                        if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_1 != null) {
                            this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.row += 1;
                        }
                        if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_0 != null) {
                            this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.row += 1;
                        }

                        if (this.moveTime === 520) {
                            if (i === EventHandler.level.row_num - 1) {
                                this.Foods[1 + i * EventHandler.level.column_num + j] = new MapGrid();
                                this.Foods[1 + i * EventHandler.level.column_num + j].noPlace = true;
                            }
                        } else {
                            if (i === 1) {
                                this.Foods[1 + i * EventHandler.level.column_num + j] = new MapGrid();
                                this.Foods[1 + i * EventHandler.level.column_num + j].noPlace = true;
                            }
                        }
                    }
                }

                for (let i = 0; i < EventHandler.level.row_num; i++) {
                    for (let j = 4; j < 8; j++) {
                        if (i === EventHandler.level.row_num - 1) {
                            this.Foods[1 + i * EventHandler.level.column_num + j] = new MapGrid();
                            this.Foods[1 + i * EventHandler.level.column_num + j].noPlace = true;
                            continue;
                        }

                        this.Foods[1 + i * EventHandler.level.column_num + j] = this.Foods[1 + (i + 1) * EventHandler.level.column_num + j];

                        if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_1 != null) {
                            this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.row -= 1;
                        }
                        if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_0 != null) {
                            this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.row -= 1;
                        }

                        if (this.moveTime === 520) {
                            if (i === 0) {
                                this.Foods[1 + i * EventHandler.level.column_num + j] = new MapGrid();
                                this.Foods[1 + i * EventHandler.level.column_num + j].noPlace = true;
                            }
                        } else {
                            if (i === EventHandler.level.row_num - 2) {
                                this.Foods[1 + i * EventHandler.level.column_num + j] = new MapGrid();
                                this.Foods[1 + i * EventHandler.level.column_num + j].noPlace = true;
                            }
                        }
                    }
                }
            }
        } else if (this.moveTime > 640 && this.moveTime < 1040) {
        } else if ((this.moveTime >= 1040 && this.moveTime <= 1160)) {
            for (let i = 0; i < EventHandler.level.row_num; i++) {
                for (let j = 0; j < 4; j++) {
                    if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_1 != null) {
                        this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.y = ((i * EventHandler.level.column_gap + EventHandler.level.row_start - this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.height / 2) - (this.moveTime - 1040) % 121 / 2);
                    }
                    if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_0 != null) {
                        this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.y = ((i * EventHandler.level.column_gap + EventHandler.level.row_start - this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.height / 2) - (this.moveTime - 1040) % 121 / 2);
                    }
                }

                for (let j = 4; j < 8; j++) {
                    if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_1 != null) {
                        this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.y = ((i * EventHandler.level.column_gap + EventHandler.level.row_start - this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.height / 2) + (this.moveTime - 1040) % 121 / 2);
                    }
                    if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_0 != null) {
                        this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.y = ((i * EventHandler.level.column_gap + EventHandler.level.row_start - this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.height / 2) + (this.moveTime - 1040) % 121 / 2);
                    }
                }
            }
            if (this.moveTime === 1160) {
                for (let i = 0; i < EventHandler.level.row_num; i++) {
                    for (let j = 0; j < 4; j++) {
                        if (i === EventHandler.level.row_num - 1) {
                            this.Foods[1 + i * EventHandler.level.column_num + j] = new MapGrid();
                            this.Foods[1 + i * EventHandler.level.column_num + j].noPlace = true;
                            continue;
                        }

                        this.Foods[1 + i * EventHandler.level.column_num + j] = this.Foods[1 + (i + 1) * EventHandler.level.column_num + j];

                        if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_1 != null) {
                            this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.row -= 1;
                            this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.y = ((i * EventHandler.level.column_gap + EventHandler.level.row_start - this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.height / 2) + 60 - (this.moveTime - 1040) % 121 / 2);
                        }
                        if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_0 != null) {
                            this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.row -= 1;
                            this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.y = ((i * EventHandler.level.column_gap + EventHandler.level.row_start - this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.height / 2) + 60 - (this.moveTime - 1040) % 121 / 2);
                        }
                        if (i === 0) {
                            this.Foods[1 + i * EventHandler.level.column_num + j] = new MapGrid();
                            this.Foods[1 + i * EventHandler.level.column_num + j].noPlace = true;
                        }
                    }
                }

                for (let i = EventHandler.level.row_num - 1; i >= 0; i--) {
                    for (let j = 4; j < 8; j++) {
                        if (i === 0) {
                            this.Foods[1 + i * EventHandler.level.column_num + j] = new MapGrid();
                            this.Foods[1 + i * EventHandler.level.column_num + j].noPlace = true;
                            continue;
                        }
                        this.Foods[1 + i * EventHandler.level.column_num + j] = this.Foods[1 + (i - 1) * EventHandler.level.column_num + j];

                        if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_1 != null) {
                            this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.row += 1;
                            this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.y = ((i * EventHandler.level.column_gap + EventHandler.level.row_start - this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.height / 2) + 60 - (this.moveTime - 1040) % 121 / 2);
                        }
                        if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_0 != null) {
                            this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.row += 1;
                            this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.y = ((i * EventHandler.level.column_gap + EventHandler.level.row_start - this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.height / 2) + 60 - (this.moveTime - 1040) % 121 / 2);
                        }

                        if (i === EventHandler.level.row_num - 1) {
                            this.Foods[1 + i * EventHandler.level.column_num + j] = new MapGrid();
                            this.Foods[1 + i * EventHandler.level.column_num + j].noPlace = true;
                        }
                    }
                }
            }
        } else if ((this.moveTime > 1160 && this.moveTime <= 1280)) {
            for (let i = 0; i < EventHandler.level.row_num; i++) {
                for (let j = 0; j < 4; j++) {
                    if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_1 != null) {
                        this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.y = ((i * EventHandler.level.column_gap + EventHandler.level.row_start - this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.height / 2) - (this.moveTime - 1040) % 121 / 2);
                    }
                    if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_0 != null) {
                        this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.y = ((i * EventHandler.level.column_gap + EventHandler.level.row_start - this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.height / 2) - (this.moveTime - 1040) % 121 / 2);
                    }
                }

                for (let j = 4; j < 8; j++) {
                    if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_1 != null) {
                        this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.y = ((i * EventHandler.level.column_gap + EventHandler.level.row_start - this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.height / 2) + (this.moveTime - 1040) % 121 / 2);
                    }
                    if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_0 != null) {
                        this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.y = ((i * EventHandler.level.column_gap + EventHandler.level.row_start - this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.height / 2) + (this.moveTime - 1040) % 121 / 2);
                    }
                }
            }
            if (this.moveTime === 1280) {
                for (let i = 0; i < EventHandler.level.row_num; i++) {
                    for (let j = 0; j < 4; j++) {
                        if (i === EventHandler.level.row_num - 1) {
                            this.Foods[1 + i * EventHandler.level.column_num + j] = new MapGrid();
                            this.Foods[1 + i * EventHandler.level.column_num + j].noPlace = true;
                            continue;
                        }
                        this.Foods[1 + i * EventHandler.level.column_num + j] = this.Foods[1 + (i + 1) * EventHandler.level.column_num + j];
                        if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_1 != null) {
                            this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.row -= 1;
                            this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.y = ((i * EventHandler.level.column_gap + EventHandler.level.row_start - this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.height / 2) + 60 - (this.moveTime - 1040) % 121 / 2);
                        }
                        if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_0 != null) {
                            this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.row -= 1;
                            this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.y = ((i * EventHandler.level.column_gap + EventHandler.level.row_start - this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.height / 2) + 60 - (this.moveTime - 1040) % 121 / 2);
                        }
                        if (i === EventHandler.level.row_num - 2) {
                            this.Foods[1 + i * EventHandler.level.column_num + j] = new MapGrid();
                            this.Foods[1 + i * EventHandler.level.column_num + j].noPlace = true;
                        }
                    }
                }

                for (let i = EventHandler.level.row_num - 1; i >= 0; i--) {
                    for (let j = 4; j < 8; j++) {
                        if (i === 0) {
                            this.Foods[1 + i * EventHandler.level.column_num + j] = new MapGrid();
                            this.Foods[1 + i * EventHandler.level.column_num + j].noPlace = true;
                            continue;
                        }
                        this.Foods[1 + i * EventHandler.level.column_num + j] = this.Foods[1 + (i - 1) * EventHandler.level.column_num + j];

                        if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_1 != null) {
                            this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.row += 1;
                            this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.y = ((this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.row * EventHandler.level.column_gap + EventHandler.level.row_start - this.Foods[1 + i * EventHandler.level.column_num + j].layer_1.height / 2) + 60 - (this.moveTime - 1040) % 121 / 2);
                        }
                        if (this.Foods[1 + i * EventHandler.level.column_num + j].layer_0 != null) {
                            this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.row += 1;
                            this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.y = ((i * EventHandler.level.column_gap + EventHandler.level.row_start - this.Foods[1 + i * EventHandler.level.column_num + j].layer_0.height / 2) + 60 - (this.moveTime - 1040) % 121 / 2);
                        }
                        if (i === 1) {
                            this.Foods[1 + i * EventHandler.level.column_num + j] = new MapGrid();
                            this.Foods[1 + i * EventHandler.level.column_num + j].noPlace = true;
                        }
                    }
                }
            }
        }
	}
}
const getUpgradeDetails = function (star) {
    switch (star) {
        case 0: {
            return {
                chance: 100,
                coinCost: 300,
                insurance: 1
            };
        }
        case 1: {
            return {
                chance: 100,
                coinCost: 600,
                insurance: 1
            };
        }
        case 2: {
            return {
                chance: 96,
                coinCost: 1000,
                insurance: 1
            };
        }
        case 3: {
            return {
                chance: 69,
                coinCost: 1500,
                insurance: 1
            };
        }
        case 4: {
            return {
                chance: 49,
                coinCost: 2000,
                insurance: 1
            };
        }
        case 5: {
            return {
                chance: 38,
                coinCost: 3000,
                insurance: 1
            };
        }
        case 6: {
            return {
                chance: 32,
                coinCost: 4500,
                insurance: 1
            };
        }
        case 7: {
            return {
                chance: 28,
                coinCost: 6000,
                insurance: 1
            };
        }
        case 8: {
            return {
                chance: 25,
                coinCost: 8000,
                insurance: 1
            };
        }
        case 9: {
            return {
                chance: 0,
                coinCost: 0,
                insurance: 1
            };
        }
    }
}
const getTips= function (){
    const id = Math.floor(Math.random()*10);
    switch (id) {
        case 0: return "Hola! Cuanto tiempo sin verte!";
        case 1: return "试试看《植物大战僵尸：旅行》吧！";
        case 2: case 3: return "辅助型卡片可以生产火苗，或是助力其他卡片";
        case 4: case 5: return "卡片的灰色背景表示它是一张攻击型卡片";
        case 6: case 7: return "卡片的黄色背景表示它是一张肉盾型卡片";
        case 8: return "一点外源咖啡因就能让夜间卡片在白天也能精力充沛";
        case 9: return "16星的咖啡粉可以对当前格造成9999点伤害";
    }
}
const showAchievement = function () {
    GEH.requestPlayAudio("achievement");
    const box = document.createElement("div");
    box.className = "achievement";
    document.body.appendChild(box);
    box.addEventListener("animationend", function () {
        this.remove();
    });

    const p = document.createElement("p");
    p.innerText = `${GAME_UI_TEXT_011}`;
    box.appendChild(p);
};
const showMap = function () {
    document.getElementById("MeiWeiFlip").style.display = "block";
    document.getElementById("MeiWei").style.display = "none";
}
const hideMap = function () {
    document.getElementById("MeiWeiFlip").style.display = "none";
    document.getElementById("MeiWei").style.display = "block";
}
const copy = function (content) {
    navigator.clipboard.writeText(content)
        .then(() => {
            WarnMessageBox({Text: `${GAME_UI_TEXT_233}`, ButtonLabelYes: `${OK}`});
        })
        .catch(err => {
            console.log(err);
        });
};
class BreadMaker extends Food {
	name = "breadmaker";

	get entity() {
		if (this.state === 'idle') {
			return "../static/images/foods/" + this.constructor.name + "/" + this.state + (this.inserted ? "_inserted" : "") + ".png";
		} else {
			return "../static/images/foods/" + this.constructor.name + "/" + this.state + ".png";
		}
	}

	width = 83.4;
	height = 80;
	stateLength = 9;
	inserted = null;

	constructor(x = 0, y = 0, type = 0, star = 0, skillLevel = 0) {
		super(x, y, type, star, skillLevel);
		this.initialPlant(x, y, type);
		this.addCost(25);
	}

	behavior() {
		if (this.state === 'idle') {
		} else {
			if (this.tick === this.stateLength - 1) {
				if (this.state === 'pop') {
					let type = 0;
					let star = 0;
					let skillLevel = 0;
					let cost = 0;
					for (let i = 0; i < GEH.cards.length; i++) {
						if (GEH.cards[i].name === this.inserted) {
							type = GEH.cards[i].type;
							star = GEH.cards[i].star;
							skillLevel = GEH.cards[i].skillLevel;
							cost = GEH.cards[i].cost;
						}
					}
					this.card = new Card(type, star, skillLevel);
					document.getElementById('BattleBackground').appendChild(this.card.slot);
					this.card.slot.style.width = "120px";
					this.card.slot.style.height = '70px';
					this.card.slot.style.transform = 'scale(0.72)';
					this.card.slot.style.boxShadow = 'rgba(0,0,0,.32) 0 0 12px';
					this.card.slot.style.borderRadius = '6px';
					this.card.slot.style.position = 'absolute';
					this.card.slot.style.top = (this.x - 20) + "px";
					this.card.slot.style.left = this.y + 'px';
					this.card.slot.style.zIndex = '999';
					this.card.cost = 0;
					this.card.sunCheck = function () {
						return true;
					}
					this.card.slot.onpointerenter = null;
					this.card.slot.innerText = '';
					this.card.slot.ontouchstart = null;
					this.card.parent = EventHandler.level;
					this.card.overlay.style.backgroundColor = 'rgba(0,0,0,.24)';
					this.card.overlay.style.borderRadius = '6px';
					this.card.plantFunc = () => {
						this.card.slot.remove();
						this.card = null;
					}
					this.inserted = null;
					this.acceleration = 0;
					this.anim = setInterval(() => {
						if (this.acceleration >= 30) {	//如果加速度足够大就停止播放动画
							clearInterval(this.anim);
							this.anim = setTimeout(() => {
								if(this.card != null && this.card.slot != null){
									this.card.slot.remove();
									const times = cost / 25;
									for (let i = 0; i < times; i++) {
										this.parent.produceSun((this.x + 40 - Math.floor(Math.random() * 12) + i * 5), this.y + 60, 25, 1);
									}
									this.card = null;
									this.anim = null;
								}
								clearTimeout(this.anim);
							}, 6400);
						} else {
							if(this.card != null && this.card.slot != null){
								this.card.slot.style.left = (this.card.slot.offsetLeft + 2) + "px";
								this.card.slot.style.top = (this.card.slot.offsetTop - 9 + this.acceleration) + "px";
								this.acceleration += 3;
							}
							else {
								clearTimeout(this.anim);
								clearInterval(this.anim);
								this.anim = null;
							}
						}
					}, 50);
				}
				this.state = 'idle';
				this.tick = 0;
				this.stateLength = 9;
			}
		}
		super.behavior();
	}

	insert(name) {
		if (this.inserted) {
			return false;
		} else {
			this.state = 'insert';
			this.inserted = name;
			this.tick = 0;
			this.stateLength = 5;
			// foods[this.column + this.row * EventHandler.level.column_num].decoration.onclick = () => {
			// 	this.state = 'pop';
			// 	this.tick = 0;
			// 	this.stateLength = 5;
			// 	foods[this.column + this.row * EventHandler.level.column_num].decoration.onclick = null;
			// };
			return true;
		}
	}

	remove() {
		this.reduceCost(25);
		super.remove();
	}
}
    #displayFestival() {
        let date = this.#getTime();
        if (this.#archive.festival == null) {
            return false;
        } else {
            for (let i = 0; i < this.#archive.festival.length; i++) {
                if (this.#archive.festival[i].endDate < date || !this.#archive.festival[i].available) {
                    this.#archive.festival.splice(i, 1);
                    i--;
                } else {
                    let box = document.createElement("div");
                    box.innerText = this.#archive.festival[i].content.title;
                    let det = document.createElement("p");
                    det.innerText = this.#archive.festival[i].content.description;
                    let button = document.createElement("a");
                    button.innerText = this.#archive.festival[i].content.buttonText;
                    document.getElementById("festival").appendChild(box);
                    box.appendChild(det);
                    box.appendChild(button);
                    switch (this.#archive.festival[i].content.buttonType) {
                        case "gift": {
                            button.onclick = () => {
                                if (GEH.#archive.festival[i].content.claimed) {
                                    WarnMessageBox({
                                        Text: `${GAME_ERROR_CODE_003}`,
                                        ButtonLabelYes: `${GAME_UI_BUTTON_000}`
                                    });
                                } else {
                                    GEH.#archive.festival[i].content.claimed = true;
                                    let content = "";
                                    for (let j in GEH.#archive.festival[i].content.gift) {
                                        let gift = getItemDetails(GEH.#archive.festival[i].content.gift[j].type);
                                        gift.addFunc(GEH.#archive.festival[i].content.gift[j].num);
                                        content += " " + gift.cName;
                                        content += "×" + GEH.#archive.festival[i].content.gift[j].num;
                                    }
                                    WarnMessageBox({
                                        Text: `${GAME_UI_TEXT_002}\n${content}！`,
                                        ButtonLabelYes: `${GAME_UI_BUTTON_000}`
                                    });
                                }
                            }
                            break;
                        }
                        case "card": {
                            button.onclick = () => {
                                if (GEH.#archive.festival[i].content.claimed) {
                                    WarnMessageBox({
                                        Text: `${GAME_ERROR_CODE_003}`,
                                        ButtonLabelYes: `${GAME_UI_BUTTON_000}`
                                    });
                                } else {
                                    GEH.#archive.festival[i].content.claimed = true;
                                    let content = "";
                                    for (let j in GEH.#archive.festival[i].content.gift) {
                                        let type = GEH.#archive.festival[i].content.gift[j].type;
                                        let detail = getFoodDetails(type);
                                        let star = GEH.#archive.festival[i].content.gift[j].star;
                                        content += " " + detail.cName;
                                        this.#addCard(type, star);
                                    }
                                    WarnMessageBox({
                                        Text: `${GAME_UI_TEXT_003}\n${content}！`,
                                        ButtonLabelYes: `${GAME_UI_BUTTON_000}`
                                    });
                                }
                            }
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                }
            }
        }
    }
    #addFestival(id, content, endDate) {
        if (endDate < this.#getTime()) {
            return false;
        }
        if (this.#archive.festival == null) {
            this.#archive.festival = [];
        }
        for (let i in this.#archive.festival) {
            if (this.#archive.festival[i].id === id) {
                return false;
            }
        }
        this.#archive.festival.push({
            id: id,
            content: content,
            endDate: endDate,
            available: true,
        });
        this.#saveArchive();
        return true;
    }