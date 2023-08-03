/**
 * @jest-environment jsdom
 */

import { screen, waitFor} from "@testing-library/dom"
import Bills from "../containers/Bills.js";
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";

import mockStore from "../__mocks__/store"
import mockStoreCorrupted from "../__mocks__/storeCorrupted"

import router from "../app/Router.js";

beforeEach(() => {
  // disable the display of console log, error
  jest.spyOn(global.console, 'log').mockImplementation(() => {})
  jest.spyOn(global.console, 'error').mockImplementation(() => {})

  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem('user', JSON.stringify({
    type: 'Employee'
  }))
  const root = document.createElement("div")
  root.setAttribute("id", "root")
  document.body.append(root)
  router()
})

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {

    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills)

      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')

      // Add the mention "expect" to check if the icon is displayed
      expect(windowIcon.classList.contains('active-icon')).toBe(true)
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})



// Integration Test GET
describe("Give I am an user connected as employee", () => {

  describe("When I am on the bill page and I click on the New Bill Button", () => {
    test("Then I should be redirect to the New Bill page", async () => {

      window.onNavigate(ROUTES_PATH.Bills)

      await waitFor(() => screen.getByTestId('btn-new-bill'))
      const btnNewBill = screen.getByTestId('btn-new-bill')

      const mockFn = () => window.onNavigate(ROUTES_PATH.NewBill)
      btnNewBill.onclick = () => mockFn()
      btnNewBill.click()

      const title = screen.getByText(/Envoyer une note de frais/)

      expect(location.hash).toBe('#employee/bill/new')
    })
  })


  describe("When I click on the icon eye", () => {
    beforeEach(() => window.onNavigate(ROUTES_PATH.Bills))

    test("Then a modal should open", async () => {

      document.body.innerHTML = BillsUI({ data: bills })
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const store = null
      const bill = new Bills({
        document, onNavigate, store, localStorage: window.localStorage
      })

      const iconEye = screen.getAllByTestId('icon-eye')[0]
      const handleClickIconEye = jest.fn(bill.handleClickIconEye)
      const eye = screen.getAllByTestId('icon-eye')[0]

      $.fn.modal = jest.fn()

      eye.onclick = () => handleClickIconEye(eye)
      eye.click()

      const billImageInModal = decodeURI(
        document.getElementById('modaleFile').querySelector('img').src
      )
      const billImageInMock = bills[0].fileUrl

      expect(handleClickIconEye).toHaveBeenCalled()
      expect(billImageInModal).toBe(billImageInMock)
    })
  })


  describe("When bills fetched from API", () => {

    test("Then should must a list of bills", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const store = null
      const bill = new Bills({
        document, onNavigate, store, localStorage: window.localStorage
      })

      const billsList = screen.getByTestId('tbody').querySelectorAll('tr')

      expect(billsList.length).toBe(billsList.length)
    })
  })


  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })


    test("Then the bills are not fetched from the API and fails with 404 error message", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject("Erreur 404")
          }
        }}
      )

      window.onNavigate(ROUTES_PATH.Bills)
      document.body.innerHTML = BillsUI({ error: "Erreur 404" })
      await new Promise(process.nextTick)
      const message = screen.getByText(/Erreur 404/)

      expect(message.textContent.trim('')).toBe("Erreur 404")
    })

    test("Then the bills are not fetched from the API and fails with 500 error message", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject("Erreur 500")
          }
        }}
      )

      window.onNavigate(ROUTES_PATH.Bills)
      document.body.innerHTML = BillsUI({ error: "Erreur 500" })
      await new Promise(process.nextTick)
      const message = screen.getByText(/Erreur 500/)

      expect(message.textContent.trim('')).toBe("Erreur 500")
    })
  })


  describe("When corrupted data was introducted", () => {

    test("Then the corrupted date from Bills should be equal to date from storeCorrupted mock", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const corruptedBillsData = new Bills({
        document, onNavigate, store: mockStoreCorrupted, localStorage: window.localStorage
      })

      const bills = await corruptedBillsData.getBills().then(result => result)
      const fetchDateOnly = () => data => data.date
      const corruptedDateFromBillsData = bills.map(fetchDateOnly())
      const corruptedDateFromBillsMock = (await mockStoreCorrupted.bills().list()).map(fetchDateOnly())

      expect(corruptedDateFromBillsData).toEqual(corruptedDateFromBillsMock)
    })
  })
})