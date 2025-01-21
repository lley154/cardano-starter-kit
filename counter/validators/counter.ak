use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/address.{Address}
use cardano/assets
use cardano/transaction.{InlineDatum, OutputReference, Transaction}
use mocktail.{
  complete, mocktail_tx, required_signer_hash, tx_in, tx_in_inline_datum, tx_out,
  tx_out_inline_datum,
}
use mocktail/virgin_address.{mock_script_address}
use mocktail/virgin_key_hash.{mock_pub_key_hash}
use mocktail/virgin_output_reference.{mock_tx_hash, mock_utxo_ref}

pub type Datum {
  owner: VerificationKeyHash,
  counter: Int,
}

pub type Redeemer {
  increment: Int,
}

fn increment_counter(datum: Datum, redeemer: Redeemer) -> Datum {
  Datum { owner: datum.owner, counter: datum.counter + redeemer.increment }
}

fn valid_output_datum(
  newDatum: Datum,
  oref: OutputReference,
  tx: Transaction,
) -> Bool {
  // script Output has same Value as input
  expect Some(ownInput) =
    list.find(tx.inputs, fn(input) { input.output_reference == oref })
  expect Some(ownOutput) =
    list.find(
      tx.outputs,
      fn(output) {
        let ownHash = ownInput.output.address.payment_credential
        output.address.payment_credential == ownHash && output.value == ownInput.output.value
      },
    )

  // check output Datum is correct (with incremented counter)
  expect InlineDatum(datum) = ownOutput.datum
  expect output_datum: Datum = datum
  newDatum == output_datum
}

validator counter {
  spend(
    datum_opt: Option<Datum>,
    redeemer: Redeemer,
    input: OutputReference,
    tx: Transaction,
  ) {
    when datum_opt is {
      Some(datum) -> {
        let increment = redeemer.increment
        let must_be_signed = list.has(tx.extra_signatories, datum.owner)
        let new_datum = increment_counter(datum, redeemer)
        (increment > 0)? && must_be_signed? && valid_output_datum(
          new_datum,
          input,
          tx,
        )
      }
      None -> False
    }
  }

  else(_) {
    fail @"unsupported purpose"
  }
}

fn mock_tx(
  is_owner_signed: Bool,
  input_datum: Datum,
  output_datum: Datum,
  script_address: Address,
) -> Transaction {
  let min_amount = assets.from_lovelace(2_000_000)

  mocktail_tx()
    |> tx_in(True, mock_tx_hash(0), 0, min_amount, script_address)
    |> tx_in_inline_datum(True, input_datum)
    |> tx_out(True, script_address, min_amount)
    |> tx_out_inline_datum(True, output_datum)
    |> required_signer_hash(is_owner_signed, mock_pub_key_hash(0))
    |> complete()
}

test test_counter() {
  let script_address = mock_script_address(0, None)
  let input_datum = Datum { owner: mock_pub_key_hash(0), counter: 0 }
  let output_datum = Datum { owner: mock_pub_key_hash(0), counter: 1 }
  let redeemer = Redeemer { increment: 1 }
  let tx = mock_tx(True, input_datum, output_datum, script_address)
  counter.spend(Some(input_datum), redeemer, mock_utxo_ref(0, 0), tx)
}

test test_failed_counter_incorrect_redeemer() {
  let script_address = mock_script_address(0, None)
  let input_datum = Datum { owner: mock_pub_key_hash(0), counter: 0 }
  let output_datum = Datum { owner: mock_pub_key_hash(0), counter: -1 }
  let redeemer = Redeemer { increment: -1 }
  let tx = mock_tx(True, input_datum, output_datum, script_address)
  !counter.spend(Some(input_datum), redeemer, mock_utxo_ref(0, 0), tx)
}

test test_failed_counter_without_signer() {
  let script_address = mock_script_address(0, None)
  let input_datum = Datum { owner: mock_pub_key_hash(0), counter: 0 }
  let output_datum = Datum { owner: mock_pub_key_hash(0), counter: 1 }
  let redeemer = Redeemer { increment: 1 }
  let tx = mock_tx(False, input_datum, output_datum, script_address)
  !counter.spend(Some(input_datum), redeemer, mock_utxo_ref(0, 0), tx)
}

test test_failed_counter_with_wrong_signer() {
  let script_address = mock_script_address(0, None)
  let input_datum = Datum { owner: mock_pub_key_hash(1), counter: 0 }
  let output_datum = Datum { owner: mock_pub_key_hash(1), counter: 1 }
  let redeemer = Redeemer { increment: 1 }
  let tx = mock_tx(True, input_datum, output_datum, script_address)
  !counter.spend(Some(input_datum), redeemer, mock_utxo_ref(0, 0), tx)
}
