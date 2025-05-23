/**
 * Returns the FizzBuzz string for a given number
 * 
 * @param {number} num - The number to convert to a FizzBuzz string
 * @returns {string} 'Fizz' if num is divisible by 3, 'Buzz' if divisible by 5,
 *          'FizzBuzz' if divisible by both, or the number as a string otherwise
 */
export function fizzBuzz(num) {
  if (num % 3 === 0 && num % 5 === 0) {
    return 'FizzBuzz'
  } else if (num % 3 === 0) {
    return 'Fizz'
  } else if (num % 5 === 0) {
    return 'Buzz'
  } else {
    return num.toString()
  }
}

/**
 * Generates an array of FizzBuzz strings for numbers from 1 to n
 * 
 * @param {number} n - The upper limit (inclusive)
 * @returns {string[]} An array of FizzBuzz strings
 */
export function generateFizzBuzz(n) {
  const result = []
  
  for (let i = 1; i <= n; i++) {
    result.push(fizzBuzz(i))
  }
  
  return result
}

describe('fizzBuzz', () => {
  it('returns "Fizz" for numbers divisible by 3 but not 5', () => {
    expect(fizzBuzz(3)).toBe('Fizz')
    expect(fizzBuzz(6)).toBe('Fizz')
    expect(fizzBuzz(9)).toBe('Fizz')
  })

  it('returns "Buzz" for numbers divisible by 5 but not 3', () => {
    expect(fizzBuzz(5)).toBe('Buzz')
    expect(fizzBuzz(10)).toBe('Buzz')
    expect(fizzBuzz(20)).toBe('Buzz')
  })

  it('returns "FizzBuzz" for numbers divisible by both 3 and 5', () => {
    expect(fizzBuzz(15)).toBe('FizzBuzz')
    expect(fizzBuzz(30)).toBe('FizzBuzz')
    expect(fizzBuzz(45)).toBe('FizzBuzz')
  })

  it('returns the number as a string for numbers not divisible by 3 or 5', () => {
    expect(fizzBuzz(1)).toBe('1')
    expect(fizzBuzz(2)).toBe('2')
    expect(fizzBuzz(4)).toBe('4')
    expect(fizzBuzz(7)).toBe('7')
  })
})

describe('generateFizzBuzz', () => {
  it('generates correct FizzBuzz sequence for n=15', () => {
    const expected = [
      '1', '2', 'Fizz', '4', 'Buzz',
      'Fizz', '7', '8', 'Fizz', 'Buzz',
      '11', 'Fizz', '13', '14', 'FizzBuzz'
    ]
    
    expect(generateFizzBuzz(15)).toEqual(expected)
  })

  it('returns an empty array for n=0', () => {
    expect(generateFizzBuzz(0)).toEqual([])
  })
})

