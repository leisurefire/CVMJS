class FennelRaft extends Level {
    static name = "茴香竹筏";
    mapAnim = "../CVMJS/static/images/interface/raft.png";
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
        if (anim) {
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