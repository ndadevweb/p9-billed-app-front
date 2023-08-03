/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import { bills } from "../fixtures/bills.js"
import mockStore from "../__mocks__/store"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import router from "../app/Router.js"

beforeEach(() => {
  // disable the display of console log, error
  jest.spyOn(global.console, 'log').mockImplementation(() => {})
  jest.spyOn(global.console, 'error').mockImplementation(() => {})
})

// Unit Test
describe("Given NewBill class", () => {

  describe("When I pass a key to 'getText' method", () => {
    test("Then with the 'file_not_allowed' key it should return an error message", () => {
      document.body.innerHTML = NewBillUI()

      const onNavigate = (pathname) => document.body.innerHTML = ROUTES({ pathname })
      const newBill = new NewBill({
        document, onNavigate, store: null, localStorage: window.localStorage
      })

      const textReturned = newBill.getText('file_not_allowed')
      const message = "Veuillez sélectionner un fichier d'image valide"

      expect(textReturned).toEqual(expect.stringContaining(message))
    })


    test("Then with a wrong key it should return an empty string", () => {
      const onNavigate = (pathname) => document.body.innerHTML = ROUTES({ pathname })
      const newBill = new NewBill({
        document, onNavigate, store: null, localStorage: window.localStorage
      })

      const textReturned = newBill.getText('wrong key')

      expect(textReturned).toBe('')
    })
  })


  describe("When I use the 'getMimeTypesAllowed' method", () => {
    test("Then it should returned the list of the mimetypes allowed", () => {
      const onNavigate = (pathname) => document.body.innerHTML = ROUTES({ pathname })
      const newBill = new NewBill({
        document, onNavigate, store: null, localStorage: window.localStorage
      })

      const mimeTypesAllowed = Object.keys(newBill.getMimeTypesAllowed())
      const shouldBe = ['image/jpeg', 'image/png']

      expect(mimeTypesAllowed).toEqual(expect.arrayContaining(shouldBe))
    })


    test("Then it should returned the list of the extensions allowed", () => {
      const onNavigate = (pathname) => document.body.innerHTML = ROUTES({ pathname })
      const newBill = new NewBill({
        document, onNavigate, store: null, localStorage: window.localStorage
      })

      const extensionsAllowed = Object.values(newBill.getMimeTypesAllowed()).flat()
      const shouldBe = ['.jpeg', '.jpg', '.png']

      expect(extensionsAllowed).toEqual(expect.arrayContaining(shouldBe))
    })
  })


  describe("When I use the 'isValidFile' method", () => {
    const mockFileDataFn = jest.fn((mimeType, extension) => {
      return {
        files: [{ name: 'fakeFileName'+extension, type: mimeType} ]
      }
    })


    test("Then if should be false if the file has a mimetype not allowed", () => {
      const onNavigate = (pathname) => document.body.innerHTML = ROUTES({ pathname })
      const newBill = new NewBill({
        document, onNavigate, store: null, localStorage: window.localStorage
      })

      const fakeFileData = mockFileDataFn('text/javascript', 'image.png')
      const isValid = newBill.isValidFile(fakeFileData)

      expect(isValid).toBe(false)
    })


    test("Then if should be false if the file has an extension not allowed", () => {
      const onNavigate = (pathname) => document.body.innerHTML = ROUTES({ pathname })
      const newBill = new NewBill({
        document, onNavigate, store: null, localStorage: window.localStorage
      })

      const fakeFileData = mockFileDataFn('image/png', 'badFile.js')
      const isValid = newBill.isValidFile(fakeFileData)

      expect(isValid).toBe(false)
    })


    test("Then if should be true if the files are valid", () => {
      const onNavigate = (pathname) => document.body.innerHTML = ROUTES({ pathname })
      const newBill = new NewBill({
        document, onNavigate, store: null, localStorage: window.localStorage
      })

      const fakeFileDataJpeg = mockFileDataFn('image/jpeg', 'image.jpeg')
      const fakeFileDataJpg = mockFileDataFn('image/jpeg', 'image.jpg')
      const fakeFileDataPng = mockFileDataFn('image/png', 'image.png')

      const isValidJpeg = newBill.isValidFile(fakeFileDataJpeg)
      const isValidJpg = newBill.isValidFile(fakeFileDataJpg)
      const isValidPng = newBill.isValidFile(fakeFileDataPng)

      expect(isValidJpeg).toBe(true)
      expect(isValidJpg).toBe(true)
      expect(isValidPng).toBe(true)
    })
  })
})



describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
  })


  describe("When I am on NewBill Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      window.onNavigate(ROUTES_PATH.NewBill)

      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')

      expect(mailIcon.classList.contains('active-icon')).toBe(true)
    })
  })


  // Integration Test POST
  describe("When I send a wrong file", () => {
    test("Then I should get an error message", () => {
      window.onNavigate(ROUTES_PATH.NewBill)
      document.body.innerHTML = NewBillUI()

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const newBill = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })

      const wrongFile = new File(['text'], 'wrongFile.txt', { type: 'text/plain'})
      const fileField = screen.getByTestId('file')
      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      fileField.addEventListener('change', handleChangeFile)

      fireEvent.change(fileField, { target: { files: [wrongFile] } })

      const shouldContainText = newBill.getText('file_not_allowed')

      expect(fileField.validationMessage).toEqual(expect.stringContaining(shouldContainText))
    })
  })


  describe("When I send a valid image file", () => {
    test("Then I should'nt get an error message", () => {
      window.onNavigate(ROUTES_PATH.NewBill)
      document.body.innerHTML = NewBillUI()

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const newBill = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })

      const validFilePng = new File(['blob'], 'validImage.png', { type: 'image/png'})
      const validFileJpg = new File(['blob'], 'validImage.jpg', { type: 'image/jpeg'})
      const fileField = screen.getByTestId('file')
      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      fileField.addEventListener('change', handleChangeFile)

      fireEvent.change(fileField, { target: { files: [validFilePng] } })

      expect(fileField.validationMessage).toEqual(expect.stringContaining(''))
      expect(fileField.files[0].name).toBe(validFilePng.name)

      fireEvent.change(fileField, { target: { files: [validFileJpg] } })

      expect(fileField.validationMessage).toEqual(expect.stringContaining(''))
      expect(fileField.files[0].name).toBe(validFileJpg.name)
    })
  })


  describe("When the form is submitted with correct values", () => {

    test("Then the bill is created and the image is uploaded", async () => {

      window.onNavigate(ROUTES_PATH.NewBill)
      document.body.innerHTML = NewBillUI()

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const newBill = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })

      const expenseTypeField = screen.getByTestId('expense-type')
      const expenseNameField = screen.getByTestId('expense-name')
      const dateField = screen.getByTestId('datepicker')
      const amountField = screen.getByTestId('amount')
      const vatField = screen.getByTestId('vat')
      const pctField = screen.getByTestId('pct')
      const commentaryField = screen.getByTestId('commentary')
      const fileField = screen.getByTestId('file')

      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      fileField.addEventListener('change', handleChangeFile)

      fireEvent.change(expenseTypeField, { target: { value: bills[0].type } })
      fireEvent.change(expenseNameField, { target: { value: bills[0].name } })
      fireEvent.change(dateField, { target: { value: bills[0].date } })
      fireEvent.change(amountField, { target: { value: bills[0].amount } })
      fireEvent.change(vatField, { target: { value: bills[0].vat } })
      fireEvent.change(pctField, { target: { value: bills[0].pct } })
      fireEvent.change(commentaryField, { target: { value: bills[0].commentary } })
      fireEvent.change(fileField, { target: { files: [
        new File(['blob'], bills[0].fileName, { type: 'image/jpg'})
      ] } })

      const updateSpy = jest.spyOn(mockStore.bills(), 'update')

      const formNewBill = screen.getByTestId('form-new-bill')
      const handleSubmit = jest.fn(newBill.handleSubmit)
      formNewBill.addEventListener('submit', handleSubmit)
      fireEvent.submit(formNewBill)

      expect(updateSpy).toHaveBeenCalled()
    })
  })


  describe("When I send a file and an error occurs from the API", () => {

    test("Then an 500 error message should be returned from the API",  async () => {

      jest.spyOn(mockStore, "bills")
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create : () =>  {
            return Promise.reject("Erreur 500")
          }
        }}
      )

      window.onNavigate(ROUTES_PATH.NewBill)
      document.body.innerHTML = NewBillUI()

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const newBill = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })

      jest.spyOn(console, 'error').mockImplementation(message => {
        document.body.innerHTML = message
      })

      const validFilePng = new File(['blob'], 'validImage.png', { type: 'image/png'})
      const fileField = screen.getByTestId('file')
      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      fileField.addEventListener('change', handleChangeFile)

      fireEvent.change(fileField, { target: { files: [validFilePng] } })

      const error = await waitFor(() => screen.getByText(/Erreur 500/))

      expect(error.textContent).toBe('Erreur 500')
    })
  })


  describe("When the form is submitted without filled", () => {

    test("Then an 401 error message should be returned from the API", async () => {

      jest.spyOn(mockStore, "bills")
      mockStore.bills.mockImplementationOnce(() => {
        return {
          update : () =>  {
            return Promise.reject("unauthorized action")
          }
        }}
      )

      window.onNavigate(ROUTES_PATH.NewBill)
      document.body.innerHTML = NewBillUI()

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const newBill = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })

      jest.spyOn(console, 'error').mockImplementation(message => {
        document.body.innerHTML = message
      })

      const formNewBill = screen.getByTestId('form-new-bill')
      const handleSubmit = jest.fn(newBill.handleSubmit)
      formNewBill.addEventListener('submit', handleSubmit)
      fireEvent.submit(formNewBill)

      const error = await waitFor(() => screen.getByText(/unauthorized action/))

      expect(error.textContent).toBe('unauthorized action')
    })

  })

})
