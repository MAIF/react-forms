import { test, expect, Page } from '@playwright/test';


// const setSchema = async (page: Page, schema: string) => {
//   const schemaField = await page.locator("#schema-container .cm-content").first()

//   schemaField.invoke("text", schema)
// }

const submitAndCheck = async (page: Page, expectedValue: Object) => {

  await page.getByRole('button', { name: 'Try it' }).click()

  const localStorageData = await page.evaluate(() => localStorage.getItem('value'));
  const value = localStorageData ? JSON.parse(localStorageData) : {}
  await expect(value).toEqual(expectedValue)
}

test('should accept default values', async ({ page }) => {
  await page.goto('http://localhost:3000/react-forms');

  const schemaField = await page.locator("#schema-container .cm-content").first()

  await schemaField.fill(`{
      name: {
        type: "string",
        defaultValue: "foo"
      }
    }`);


  await expect(page.getByRole('textbox', { name: 'name' })).toHaveValue("foo");
  await submitAndCheck(page, { name: "foo" })
});

test('should allow to change value', async ({ page }) => {
  await page.goto('http://localhost:3000/react-forms');

  const schemaField = await page.locator("#schema-container .cm-content").first()

  await schemaField.fill(`{
      name: {
        type: "string"
      }
    }`);


  await page.getByRole('textbox', { name: 'name' }).fill('bar');
  await page.getByRole('button', { name: 'Try it' }).click();

  await submitAndCheck(page, { name: 'bar' })
});

test('should not be displayed if visible is false', async ({ page }) => {
  await page.goto('http://localhost:3000/react-forms');

  const schemaField = await page.locator("#schema-container .cm-content").first()

  await schemaField.fill(`{
      name: {
        type: "string",
        visible: false
      }
    }`);


  await expect(page.getByRole('textbox', { name: 'name' })).toBeHidden();

});


test('should not allow input when disabled', async ({ page }) => {
  await page.goto('http://localhost:3000/react-forms');

  const schemaField = await page.locator("#schema-container .cm-content").first()

  await schemaField.fill(`{
      name: {
        type: "string",
        disabled: true
      }
    }`);


  await expect(page.getByRole('textbox', { name: 'name' })).toHaveAttribute('readonly');
});


test('allow label modification', async ({ page }) => {
  await page.goto('http://localhost:3000/react-forms');

  const schemaField = await page.locator("#schema-container .cm-content").first()

  await schemaField.fill(`{
      name: {
        type: "string",
        label: "firstname"
      }
    }`);


  await expect(page.getByRole('textbox', { name: 'firstname' })).toBeVisible();
});

test('should allow specific onChange callback', async ({ page }) => {
  await page.goto('http://localhost:3000/react-forms');

  const schemaField = await page.locator("#schema-container .cm-content").first()

  await schemaField.fill(`{
      name: {
        type: "string",
        onChange: ({rawValues, value, setValue}) => {
          setValue('name', value + " " +value)
        }
      }
    }`);


  await page.getByRole('textbox', { name: 'name' }).fill('test');
  await submitAndCheck(page, { name: "test test" })
});


