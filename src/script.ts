type Direction = 'top' | 'bottom' | 'right' | 'left'

const generateNumber = (): number => {
    const num = Math.trunc(Math.random() * 10)
    if (num === 0) return 10
    return num
}
const getXY = (elem: HTMLDivElement): [number, number] => {
    let [y, x]: (number | string)[] = elem.id.split('/')
    x = +x
    y = +y
    return [x, y]
}
const id$ = (id: string) => document.getElementById(id)
const class$ = (className: string) => document.getElementsByClassName(className)

//@ts-expect-error
const startButton: HTMLButtonElement = id$('start')
const scoreBox = id$('score')
const recordBox = id$('record')

let record = 0

class Food {
    generate(cells: HTMLDivElement[][]): void {
        while (true) {
            const x = generateNumber()
            const y = generateNumber()
            if (cells[y][x].className.includes('snake')) continue
            this.cell = cells[y][x]
            break
        }
    }
    render() {
        if (this.cell) {
            this.cell.className = 'cell food'
        } else {
            console.error('no food cell')
        }
    }
    cell: HTMLDivElement | undefined
}

class Snake {
    constructor(initCell1: HTMLDivElement, initCell2: HTMLDivElement) {
        this.snakeCells.push(initCell1)
        this.snakeCells.push(initCell2)
    }
    get len() {
        return this.snakeCells.length
    }
    #direction: Direction = 'top'
    get direction() {
        return this.#direction
    }
    set direction(value: Direction) {
        this.prevDirection = this.#direction
        this.#direction = value
    }
    prevDirection: Direction = 'top'
    snakeCells: HTMLDivElement[] = []
    render() {
        this.snakeCells.forEach((cell) => {
            if (cell) cell.className = 'cell snake'
        })
    }
}

class Game {
    constructor() {
        this.setCells()
        this.setKeyboard()
    }
    public start() {
        this.snake = new Snake(this.cells[5][5], this.cells[6][5])
        this.food.generate(this.cells)
        this.setInterval()
        startButton!.disabled = true
        startButton!.textContent = 'Score'
    }
    private end() {
        clearInterval(this.interval)
        startButton!.disabled = false
        startButton!.textContent = 'Start'
        scoreBox!.innerHTML += ' game end'
        this.speed = 1
        if (record < this.score) {
            record = this.score
            recordBox!.innerHTML = 'Record ' + record
        }
    }
    get score() {
        if (this.snake) return this.snake.len - 2
        return 0
    }
    private interval: number = 0
    private cells: HTMLDivElement[][] = []
    private speed = 1
    private speedIncrease = 0.9
    private snake: Snake | undefined
    private food = new Food()
    private setCells() {
        const box = id$('game')
        this.cells.push(Array())
        for (let y = 1; y <= 10; y++) {
            this.cells.push(Array())
            this.cells[y].push(document.createElement('div'))
            for (let x = 1; x <= 10; x++) {
                const element = document.createElement('div')
                element.id = y + '/' + x
                element.className = 'cell'
                box!.appendChild(element)
                this.cells[y].push(element)
            }
        }
    }
    private setKeyboard() {
        const selectDir = (dir: Direction) => {
            console.log('selectdir ', dir)
            if (
                (dir === 'right' && this.snake?.direction === 'left') ||
                (dir === 'left' && this.snake?.direction === 'right') ||
                (dir === 'top' && this.snake?.direction === 'bottom') ||
                (dir === 'bottom' && this.snake?.direction === 'top')
            )
                return
            this.snake!.direction = dir
        }
        document.onkeyup = (ev) => {
            if (ev.key === 'ArrowUp') selectDir('top')
            if (ev.key === 'ArrowDown') selectDir('bottom')
            if (ev.key === 'ArrowLeft') selectDir('left')
            if (ev.key === 'ArrowRight') selectDir('right')
        }
    }
    private setInterval = () => {
        if (this.interval) clearInterval(this.interval)
        const func = () => {
            console.log('render speed ' + this.speed)
            this.render()
        }
        this.interval = setInterval(func.bind(this), this.speed * 1000)
    }
    private increaseSpeed() {
        this.speed = this.speed * this.speedIncrease
        this.setInterval()
    }
    private async tick() {
        try {
            let [x, y] = getXY(this.snake!.snakeCells[0])
            switch (this.snake!.direction) {
                case 'bottom':
                    y++
                    break
                case 'top':
                    y--
                    break
                case 'left':
                    x--
                    break
                case 'right':
                    x++
                    break
                default:
                    break
            }
            this.snake!.snakeCells.forEach((cell) => {
                const [cx, cy] = getXY(cell)
                if (cx === x && cy === y) throw this.end()
            })
            if (!this.cells[y][x]) return this.end()
            if (this.cells[y][x].className.includes('food')) {
                this.feed()
            } else {
                await this.move(x, y)
            }
        } catch (error) {
            console.error(error)
            this.end()
        }
    }
    private async move(x: number, y: number) {
        console.log('move ' + this.snake?.direction, 'to ', x, y)
        let prevXY: [number, number] = [x, y]
        for (let cellIdx = 0; cellIdx < this.snake?.len!; cellIdx++) {
            const nextXY = [...prevXY]
            // console.log('nextXY ', nextXY)
            prevXY = [...getXY(this.snake?.snakeCells[cellIdx]!)]
            // console.log('prevXY ', prevXY)
            // console.log('prevCell', this.snake?.snakeCells[cellIdx]!)
            this.snake!.snakeCells[cellIdx] = this.cells[nextXY[1]][nextXY[0]]
            // console.log('nextCell', this.snake?.snakeCells[cellIdx]!)
        }
        // console.log(this.snake?.snakeCells)
    }
    private feed() {
        console.log('food')
        this.snake?.snakeCells.unshift(this.food.cell!)
        scoreBox!.innerHTML = this.score.toString()
        this.increaseSpeed()
        this.food.generate(this.cells)
    }
    private async render() {
        await this.tick()

        this.cells.forEach((row) => {
            row.forEach((cell) => {
                if (cell) cell.className = 'cell'
            })
        })

        this.food.render()
        if (this.snake) this.snake.render()
    }
}

const game = new Game()

const startGame = () => {
    game.start()
}

startButton!.onclick = startGame
