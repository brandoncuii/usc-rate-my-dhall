import { Page } from 'playwright'
import { getPacificDateISO } from '../utils/date'

export async function setDateToToday(page: Page): Promise<void> {
  const todayISO = getPacificDateISO()
  console.log(`Setting date picker to today: ${todayISO}`)

  try {
    const dateInput = await page.$('input#date, input.js-menu-date')

    if (!dateInput) {
      console.log('Could not find date input')
      return
    }

    const currentValue = await dateInput.inputValue()
    console.log(`Current date value: ${currentValue}`)

    if (currentValue === todayISO) {
      console.log('Date is already set to today')
      return
    }

    // Click to open date picker
    await dateInput.click()
    await page.waitForTimeout(500)

    // Take screenshot of date picker (for debugging)
    await page.screenshot({ path: 'datepicker-popup.png' })

    // Try to click "Today" button if it exists
    const todayButton = page.getByText('Today', { exact: true })
    if (await todayButton.count() > 0) {
      await todayButton.first().click()
      console.log('Clicked "Today" button')
      await page.waitForTimeout(1000)
    } else {
      // Fallback: Set the value directly and trigger change event
      await dateInput.fill(todayISO)
      console.log(`Set date input to: ${todayISO}`)

      await page.evaluate(() => {
        const input = document.querySelector('input#date, input.js-menu-date') as HTMLInputElement
        if (input) {
          input.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })
      await page.waitForTimeout(2000)
    }

    const newValue = await dateInput.inputValue()
    console.log(`Date value after update: ${newValue}`)

  } catch (error) {
    console.log('Error interacting with date picker:', error)
  }
}
