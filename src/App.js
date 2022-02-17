import React, { useEffect, useState, useCallback } from "react"
import { ethers } from "ethers"
import "./App.css"
import abi from "./util/WavePortal.json"
import {
  emptyMessageOnBackspace,
  emptyMessageOnSubmit,
  none,
} from "./util/errors"

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("")
  const [waveCount, setWaveCount] = useState(0)
  const [waves, setWaves] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState(none)

  const contractAddress = "0xC9a6fdE70007821f88cf177020B9cAF3E7B68Ab1"
  const contractABI = abi.abi

  const getWaveCount = useCallback(async () => {
    try {
      const { ethereum } = window
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        )

        const count = await wavePortalContract.getTotalWaves()
        setWaveCount(count.toNumber())
      }
    } catch (e) {
      console.error(e)
    }
  }, [contractABI])

  const getAllWaves = useCallback(async () => {
    try {
      const { ethereum } = window
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        )

        const waves = await wavePortalContract.getAllWaves()
        let wavesArr = []
        waves.forEach((wave) => {
          wavesArr.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          })
        })
        setWaves(wavesArr)
      } else {
        console.log("no ethereum object")
      }
    } catch (e) {
      console.error(e)
    }
  }, [contractABI])

  const checkIfWalletIsConnected = useCallback(async () => {
    try {
      const { ethereum } = window

      if (!ethereum) {
        console.log("Make sure you have MetaMask")
      } else {
        console.log("Found ethereum object", ethereum)
      }

      const accounts = await ethereum.request({ method: "eth_accounts" })

      if (accounts.length !== 0) {
        const account = accounts[0]
        console.log("found an authorized account", account)
        await getWaveCount()
        await getAllWaves()
        setCurrentAccount(account)
      } else {
        console.log("no authorized account found")
      }
    } catch (e) {
      console.error(e)
    }
  }, [getAllWaves, getWaveCount])

  const connectWallet = async () => {
    try {
      const { ethereum } = window

      if (!ethereum) {
        alert("get metamask!")
        return
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" })

      console.log("connected", accounts[0])
      await getWaveCount()
      await getAllWaves()
      setCurrentAccount(accounts[0])
    } catch (e) {
      console.error(e)
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        )

        if (message) {
          const waveTx = await wavePortalContract.wave(message)

          setMessage("")
          setIsError(false)
          setError(none)
          setIsLoading(true)

          await waveTx.wait()

          setIsLoading(false)
        } else {
          setIsError(true)
          setError(emptyMessageOnSubmit)
          return
        }
      } else {
        console.log("no ethereum object")
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleInput = (event) => {
    if (event.target.value) {
      setIsError(false)
      setError(none)
      setMessage(event.target.value)
    } else {
      setIsError(true)
      setError(emptyMessageOnBackspace)
      setMessage("")
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected()
  }, [checkIfWalletIsConnected])

  useEffect(() => {
    let wavePortalContract

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message)
      setWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ])
      setWaveCount((prevState) => {
        return prevState + 1
      })
    }

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      )
      wavePortalContract.on("NewWave", onNewWave)
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave)
      }
    }
  }, [contractABI])

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          <span role="img" aria-label="waving hand emoji">
            👋
          </span>{" "}
          Hey there!
        </div>

        <div className="bio">
          My name is Zach and I'm learning web3 development on buildspace!
          Connect your Ethereum wallet and wave at me!
        </div>

        {currentAccount && (
          <div className="info">
            {waveCount}{" "}
            <span role="img" aria-label="waving hand emoji">
              👋
            </span>
          </div>
        )}

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect wallet
          </button>
        )}

        {currentAccount && (
          <>
            <textarea
              type="text"
              className="messageInput"
              onChange={(e) => handleInput(e)}
              value={message}
            />
            {isError && <span className="inputError">{error}</span>}
            <button className="waveButton" onClick={wave} disabled={isLoading}>
              {isLoading ? "Waving..." : "Wave at me"}
            </button>
          </>
        )}

        {currentAccount &&
          waves.map((wave, index) => {
            return (
              <div key={index} className="wave">
                <div>Address: {wave.address}</div>
                <div>Timestamp: {wave.timestamp.toString()}</div>
                <div>Message: {wave.message}</div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
