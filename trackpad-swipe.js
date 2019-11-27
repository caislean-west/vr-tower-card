/*
TrackpadSwipe: Does what the name says
caislean-west / 8/22/2018
=========================
Features:
- Tap
- Multitap
- D-pad Tap
- Velocity scroll
- Swipes
*/

AFRAME.registerComponent('trackpad-swipe', {
	schema: { 
		swipeEnable: { type: 'boolean', default: false },
		dpadEnable: { type: 'boolean', default: false },
		dpadDeadband: { type: 'number', default: 0.1 },
		vscrollEnable: { type: 'boolean', default: false },
		debug: { type: 'boolean', default: false }
	},
	log: function(msg) {
		if (this.data.debug) {
			console.log(msg);
		}
	},
	init: function() {
		// Swipe variables
		this.swipeEnable = this.data.swipeEnable;
		this.deadzone = 0.2;
		this.touchStart = null;
		this.touchEnd = null;
		this.sampleDelay = 40;
		this.sampleCount = 0;

		// Tap variables
		this.singleTapDur = 1000;
		this.doubleTapDur = 200;
		this.singleTapActive = false;
		this.doubleTapActive = false;
		this.singleTapFn = null;
		this.doubleTapFn = null;
		this.tapCount = 0;

		// Dpad variables
		this.dpadEnable = this.data.dpadEnable;
		this.dpadDeadband = this.data.dpadDeadband;

		// Misc
		this.vscrollEnable = this.data.vscrollEnable;

		var self = this;

		this.log("TrackpadSwipe Init");
		// Begin finger-down action registration
		this.el.addEventListener('trackpadtouchstart', function(event) {
			if (self.singleTapFn != null) {
				clearTimeout(self.singleTapFn);
				self.singleTapFn = null;
			}
			self.singleTapActive = true;

			if (self.axisFn != null) {
				self.el.removeEventListener('axismove', self.axisFn);
				self.log("AXISMOVE Removed");
				self.axisFn = null;
			}
			// Get axis value at start
			if (self.swipeEnable) {
				self.axisFn = self.el.addEventListener('axismove', function(event) {
					self.sampleCount++;
					if (self.sampleCount > self.sampleDelay) {
						self.log(event.detail.axis);
						self.touchStart = Object.assign({}, self.touchEnd);
						self.touchEnd = Object.assign({}, event.detail.axis);
						self.sampleCount = 0;
					}
				});
			} 
			else if (self.vscrollEnable) {
				self.vscrolling = false;

				self.axisFn = self.el.addEventListener('axismove', function(event) {
					self.sampleCount++;
					if (self.sampleCount > self.sampleDelay) {
						// Get first position of touch to diff with
						if (!self.vscrolling) {
							self.touchStart = Object.assign({}, event.detail.axis);
							self.vscrolling = true;
						}
						self.touchEnd = Object.assign({}, event.detail.axis);
						var diff = self.touchEnd[1] - self.touchStart[1];
						self.log("ScrollDIFF: "+diff);
						self.el.emit('trackpad-vscroll', {vel: diff}, true);
						self.sampleCount = 0;
					}
				});
			}
			self.log("AXISMOVE Added");

			self.singleTapFn = setTimeout(function() {
				self.singleTapActive = false;
			}, self.singleTapDur);
		});
		
		// Determine action on finger up
		this.el.addEventListener('trackpadtouchend', function() {
			self.el.removeEventListener('axismove', self.axisFn);
			self.log("AXISMOVE Removed");
	
			// Fast, tapping inputs
			if (self.singleTapActive) {
				self.tapCount++;
				self.el.emit('trackpad-tap', {count: self.tapCount}, true);
			}
			if (self.doubleTapFn != null) {
				clearTimeout(self.doubleTapFn);
				self.doubleTapFn = null;
			}
			self.doubleTapActive = true;
			self.doubleTapFn = setTimeout(function() {
				self.doubleTapActive = false;
				if (self.tapCount == 2) {
					self.el.emit('trackpad-doubletap', {count: self.tapCount}, true);
				}
				self.tapCount = 0;
			}, self.doubleTapDur);

			// Slower gestures
			if (self.swipeEnable) {
				// Check direction and generate event
				if (self.touchStart != null && self.touchEnd != null) {
					var v1 = self.touchStart;
					var v2 = self.touchEnd;
					var touchVec = { x: (v2[0]-v1[0]), y: (v2[1]-v1[1]) };
					
					self.el.emit('trackpad-swipe', {vector: touchVec}, true);
				}
			}
			// Honestly, this should be a part of the tap deal
			if (self.dpadEnable) {
				// Check where endpoint was in the "dpad" X pattern
				if (self.touchEnd != null) {
					var x = self.touchEnd[0];
					var y = self.touchEnd[1];
					// Outside deadband?
					if (Math.abs(x) > self.dpadDeadband 
							&& Math.abs(y) > self.dpadDeadband) {
						var d1 = y - x;
						var d2 = y + x;
						if (d1 > 0 && d2 > 0) {
							self.el.emit('trackpad-dpad', {dir: 'up'}, true);
						} else if (d1 > 0 && d2 < 0) {
							self.el.emit('trackpad-dpad', {dir: 'left'}, true);
						} else if (d1 < 0 && d2 < 0) {
							self.el.emit('trackpad-dpad', {dir: 'down'}, true);
						} else if (d1 < 0 && d2 > 0) {
							self.el.emit('trackpad-dpad', {dir: 'right'}, true);
						} 
					}
				}
			}
			// Clear out touch endpoints 
			self.touchStart = null;
			self.touchEnd = null;

		});

		// Generate cardinal swipe
		this.el.addEventListener('trackpad-swipe', function (event) {
			var v = event.detail.vector;
			var d = self.deadzone;
			
			if (v.x > d && -d < v.y && v.y < d) {
				self.el.emit('trackpad-swipe-cardinal', { dir: 'right'}, true);
			} else if (v.x < -d && -d < v.y && v.y < d) {
				self.el.emit('trackpad-swipe-cardinal', { dir: 'left'}, true);
			} else if (v.y > d && -d < v.x && v.x < d) {
				self.el.emit('trackpad-swipe-cardinal', { dir: 'up'}, true);
			} else if (v.y < -d && -d < v.x && v.x < d) {
				self.el.emit('trackpad-swipe-cardinal', { dir: 'down'}, true);
			}
		});

		// Log number of taps for reference
		if (this.debug) {
			this.el.addEventListener('trackpad-tap', function (event) {
				var n = event.detail.count;
				self.log('TAP: '+n);
			});
			this.el.addEventListener('trackpad-dpad', function (event) {
				var n = event.detail.dir;
				self.log('DPAD: '+n);
			});
		}

	}
});

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
				  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

AFRAME.registerComponent('trackpad-swipe-visualizer', {
	schema: { 
		debug: { type: 'boolean', default: false },
		trailLen: { type: 'number', default: 100 },
		menuId: { type: 'string', default: 'under-menu' },
		gridPos: { type: 'vec3', default: { x: 0.06, y: 0, z: 0.01 } },
		gridScale: { type: 'number', default: 0.025 }
	},
	generateGrid: function() {
		var gel = document.createElement('a-entity');
		gel.setAttribute('id', 'gridId');
		gel.setAttribute('position', this.data.gridPos);
		gel.setAttribute('geometry', "primitive: plane;"
																 +"width: "+2*this.data.gridScale+"; "
																 +"height: "+2*this.data.gridScale+"; "); 
		gel.setAttribute('material', "color: gray");
		this.menuEl.appendChild(gel);
		this.gridEl = gel;

		this.dots = [];
		for (var i = 0; i < this.data.trailLen; i++) {
			var dot = document.createElement('a-sphere');
			var p =	Object.assign({}, this.points[i]);
			p.x = p.x * this.data.gridScale;
			p.y = p.y * this.data.gridScale;
			p.z = this.dotHeight + (0.00001 * i);
			dot.setAttribute('position', p.toString());
			var cval = Math.trunc(i.map(0, this.data.trailLen, 16, 255));
			dot.setAttribute('color', '#'+cval.toString(16)+"0000");
			dot.setAttribute('radius', this.dotRadius);
			gel.appendChild(dot);
			this.dots.push(dot);
		}
	},
	renderGrid: function() {
		if (this.data.trailLen != this.dots.length || this.data.trailLen != this.points.length) {
			console.log("Length mismatch");
		}

		for (var i = 0; i < this.data.trailLen; i++) {
			var dot = this.dots[i];
			var p =	Object.assign({}, this.points[i]);
			p.x = p.x * this.data.gridScale;
			p.y = p.y * this.data.gridScale;
			p.z = this.dotHeight + (0.0001 * i);
			dot.setAttribute('position', p);
		}
	},
	zeroAllPoints: function() {
		this.points = [];
		for (var i = 0; i < this.data.trailLen; i++) {
			this.points.push({ x: 0, y: 0, z: 0 });
		}
	},
	setGridColor: function(color) {
		this.gridEl.setAttribute('material', "color: "+color);
	},
	addPoint: function(p) {
					/*
		var pt = this.points[this.pointIndex]; 
	 	pt.x = p.x; 
		pt.y = p.y;
		this.pointIndex++;
		if (this.pointIndex >= this.data.trailLen) this.pointIndex = 0;
		*/
		pt = this.points.shift();
	 	pt.x = p.x; 
		pt.y = p.y;
		this.points.push(pt);
	},
	deadband: function(val, range) {
		if (val < range && -range < val) return true;
		else return false;
	},
	deadband2: function(v, range) {
		if (this.deadband(v[0], range) && this.deadband(v[1], range)) return true;
		else return false;
	},
	init: function() {
		if (!this.data.menuId) {
			console.log("No menu id given.");
			return;
		}
		this.menuEl = document.querySelector('#'+this.data.menuId);

		// Dot attributes
		this.points = [];
		this.pointIndex = 0;
		this.dotHeight = 0.001;
		this.dotRadius = 0.002;

		this.zeroAllPoints();
		this.generateGrid();
		this.renderGrid();

		var self = this;
		this.el.addEventListener('axismove', function(event) {
			var v = event.detail.axis;
			var chg = event.detail.changed;
			//if (chg[0] && chg[1] && !self.deadband2(v, 0.3)) {
				self.addPoint({ x: -v[0], y: v[1] });
				self.renderGrid();
			//}
		});
		
		this.el.addEventListener('trackpadtouchstart', function(event) {
			//self.zeroAllPoints();
			self.setGridColor('blue');
		});
		this.el.addEventListener('trackpadtouchend', function(event) {
			//self.zeroAllPoints();
			self.setGridColor('gray');
		});
	}
});
		
