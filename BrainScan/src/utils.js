function getRandomInt(min, max) {
	min = Math.ceil(min)
	max = Math.floor(max)
	return Math.floor(Math.random() * (max - min)) + min
}

function hash(x, y) {
	return x + ',' + y
}

function unhash(key) {
	let pos = key.split(',')
	return {
		x: parseInt(pos[0]),
		y: parseInt(pos[1])
	}
}

class Range {
	constructor(begin = 0, end = 0, step = 1) {
		this.begin = begin
		this.end = end
		this.step = step
	}

	*[Symbol.iterator]() {
		if (this.step > 0) {
			for (let i = this.begin; i < this.end; i += this.step) {
				yield i
			}
		} else if (this.step < 0) {
			for (let i = this.begin; i > this.end; i += this.step) {
				yield i
			}
		}
	}
}

function range(...args) {
	return new Range(...args)
}

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max)
}

function within(position, left, top, width, height) {
	return (position.x >= left && position.x < left + width
		&& position.y >= top && position.y < top + height)
}
