$(function() {
  // Declare Constants
  const rpc = 'https://api.primersion.com/contracts';

  function addBack() {
  	let length = $('#btns').length;
  	if (length < 1) {
  		$('#results').append('<div id="btns"></div>');
  	}
    $('#btns').append('<button class="secondary back">Back</button>');
    $(".back").on("click tap", function(event){
      event.preventDefault()
      json_payload = [];
      stake_list = [];
      pending = [];
      $('#results').fadeOut('slow', function(){
        $('#tokens').empty();
        $('#btns').empty();
        $('#stake').prop("disabled",false)
        $('#unstake').prop("disabled",false)
        $('#claim').prop("disabled",false)
        location.reload();
      });
    });
  }

  function getBalances(account) {
    return new Promise((resolve, reject) => {
      const query = {
        'id': 1,
       'jsonrpc': '2.0',
       'method': 'find',
       'params': {
          'contract': 'tokens',
          'table': 'balances',
          'query': {
            'account': account
          }
        }
      }
      axios.post(rpc, query).then((result) => {
        return resolve(result.data.result)
      }).catch((err) => {
        console.log(err)
        return reject(err)
      })
    })
  }

  function sendQuery(account, net, json_payload, title) {
    if (typeof hive_keychain === 'object') {
      hive_keychain.requestCustomJson(
        account,
        net,
        'Active',
        json_payload,
        title,
        function(response) {
          if (!response['success']) {
            $('#results').fadeOut('slow', function(){
              $('#accountForm').fadeIn('slow', function() {
                $('#error').text(response.message);
                $('#tokens').empty();
                $('#btns').empty();
                $(':disabled').prop('disabled', false);
              })
            })
          } else {
            $('#results').html('<h2>'+title+' successfully completed!</h2>');
            addBack();
          }
        }
      )
    } else {
      signerUrl = 'https://hivesigner.com/sign/custom-json?required_auths=["'+account+'"]&id='+net+'&authority=active&required_posting_auths=[]&json='+json_payload
      window.location.href = signerUrl;
    }
  }

  $("#stake").on("click tap", function(event){
    $('#stake').prop("disabled",true);
    let account = $('#hiveAccount').val().toLowerCase();

    if (account.length < 3) {
      $('#error').text('Minimum 3 letters');
      $('#stake').prop("disabled",false);
      return;
    }

    var wallet = $('#hiveAccount').val().toLowerCase()
    stake_list = []
    all_list = []
    Promise.resolve(getBalances(wallet)).then((result) => {
      result.forEach((row) => {
      	all_list.push(row);
        if (parseFloat(row['balance']) > 0.0 && parseFloat(row['stake']) > 0.0) {
          stake_list.push({'symbol': row['symbol'], 'balance': row['balance']})
        }
      })

      if (stake_list.length <= 0) {
        $('#error').text('Don\'t find any tokens to stake :(');
        $('#stake').prop("disabled",false);
        return
      }

      $('#title').text('Tokens to stake');

      stake_list.sort((a,b)=> (a.symbol > b.symbol ? 1 : -1))
      stake_list.forEach( (item) => {
        $('#tokens').append('<input class="token" type="checkbox" data-balance="'+item['balance']+'" id="'+item['symbol']+'" name="'+item['symbol']+'" /><label for="'+item['symbol']+'">'+item['balance']+' '+item['symbol']+'</label><br />')
      })

      $('#btns').append('<button id="stakeNow">Stake Them now !</button>')
      addBack()

      $('#accountForm').fadeOut('slow', function(){
        $('#results').fadeIn('slow')
      })

      $("#checkAll").on('click tap', function(){
        $('input:checkbox').not(this).prop('checked', this.checked);
      });

      $('#stakeNow').on('click tap', function() {
        json_payload = []
        $(".token:checkbox:checked").each(function() {
          json_payload.push({
            'contractName': 'tokens',
            'contractAction': 'stake',
            'contractPayload': {
              'symbol': $(this).attr('id'),
              'to': wallet,
              'quantity': String($(this).data('balance'))
            }
          })
        });
        json_payload = JSON.stringify(json_payload);
        net = 'ssc-mainnet-hive';
        title = 'MultiStaker : Stake';
        sendQuery(account, net, json_payload, title);
      })
    })
    event.preventDefault();
  })
  
  // Unstake tokens
  $("#unstake").on("click tap", function(event){
    $('#unstake').prop("disabled",true);
    let account = $('#hiveAccount').val().toLowerCase();

    if (account.length < 3) {
      $('#error').text('Minimum 3 letters');
      $('#unstake').prop("disabled",false);
      return;
    }

    var wallet = $('#hiveAccount').val().toLowerCase()
    unstake_list = []
    Promise.resolve(getBalances(wallet)).then((result) => {
      result.forEach((row) => {
        if (parseFloat(row['stake']) > 0.0) {
          unstake_list.push({'symbol': row['symbol'], 'stake': row['stake']})
        }
      })

      if (unstake_list.length <= 0) {
        $('#error').text('Don\'t find any tokens to unstake :(');
        $('#unstake').prop("disabled",false);
        return;
      }

      $('#title').text('Tokens to unstake');

      unstake_list.sort((a,b)=> (a.symbol > b.symbol ? 1 : -1))
      unstake_list.forEach( (item) => {
        $('#tokens').append('<input class="token numbers" type="number" min="0.001" max="'+item['stake']+'" data-stake="'+item['stake']+'" id="'+item['symbol']+'" name="'+item['symbol']+'" /><span class="tokenselect">'+item['stake']+' '+item['symbol']+'</span><br />')
      })

      $('#btns').append('<button id="unstakeNow">Unstake Them now !</button>')
      addBack()

      $('#accountForm').fadeOut('slow', function(){
        $('#results').fadeIn('slow')
      })

      $("#checkAll").on('click tap', function(){
      	$('.numbers').each(function(){
      		$(this).val($(this).attr('max'));
      	})
      });

      $('.tokenselect').on('click tap', function() {
        let bal = $(this).prevAll('.token').data('stake');
        $(this).prev('.token').val(bal);
      });

      $('#unstakeNow').on('click tap', function() {
        json_payload = []
        $(".numbers").each(function() {
        	if ($(this).val() !='') {
		        json_payload.push({
		          'contractName': 'tokens',
		          'contractAction': 'unstake',
		          'contractPayload': {
		            'symbol': $(this).attr('id'),
		            'quantity': String($(this).val())
		          }
		        })
          }
        });
        json_payload = JSON.stringify(json_payload);
        net = 'ssc-mainnet-hive';
        title = 'MultiStaker : Unstake';
        sendQuery(account, net, json_payload, title);
      })
    })
    event.preventDefault();
  });

  $("#sendTo").on("click tap", function(event) {
    $('#sendTo').prop("disabled",true);
    event.preventDefault();
    let account = $('#hiveAccount').val().toLowerCase();

    if (account.length < 3) {
      $('#error').text('Minimum 3 letters');
      $('#sendTo').prop("disabled",false);
      return;
    }

    var wallet = $('#hiveAccount').val().toLowerCase()
    send_list = []
    Promise.resolve(getBalances(wallet)).then((result) => {
      result.forEach((row) => {
        if (parseFloat(row['balance']) > 0.0) {
          send_list.push({'symbol': row['symbol'], 'balance': row['balance'], 'stake': row['stake']})
        }
      })

      if (send_list.length <= 0) {
        $('#error').text('Don\'t find any tokens to send :(');
        $('#sendTo').prop("disabled",false);
        return;
      }

      $('#title').text('Tokens to send');

      send_list.sort((a,b)=> (a.symbol > b.symbol ? 1 : -1))
      send_list.forEach( (item) => {
        $('#tokens').append('<input class="token numbers" type="number" min="0.001" max="'+item['balance']+'" data-balance="'+item['balance']+'" data-stake="'+item['stake']+'" id="'+item['symbol']+'" name="'+item['symbol']+'" /><span class="tokenselect">'+item['balance']+' '+item['symbol']+'</span><br />')
      })
      
      $('#tokens').append('<label for="receiver">Receiving account: <input id="receiver" name="receiver" type="text"></label>');
      $('#tokens').append('<label for="action"><input type="checkbox" id="action" name="action"> Autostake</label>');

      $('#btns').append('<button id="sendNow">Send Them now !</button>')
      addBack()

      $('#accountForm').fadeOut('slow', function(){
        $('#results').fadeIn('slow')
      })

      $("#checkAll").on('click tap', function(){
      	$('.numbers').each(function(){
      		$(this).val($(this).attr('max'));
      	})
      });

      $('.tokenselect').on('click tap', function() {
        let bal = $(this).prevAll('.token').data('balance');
        $(this).prev('.token').val(bal);
      });

      $('#sendNow').on('click tap', function() {
        json_payload = [];
        action = 'transfer';
        receiver = $('#receiver').val();
        $(".numbers").each(function() {
          stake = $(this).data('stake');
          if(($('#action').is(':checked')) && (stake !== 0)) {
            action = 'stake';
          } else {
            action = 'transfer';
          }
        	if ($(this).val() !='') {
		        json_payload.push({
		          'contractName': 'tokens',
		          'contractAction': action,
		          'contractPayload': {
                'to' : receiver,
		            'symbol': $(this).attr('id'),
		            'quantity': String($(this).val())
		          }
		        })
          }
        });
        json_payload = JSON.stringify(json_payload);
        net = 'ssc-mainnet-hive';
        title = 'MultiStaker : Send to '+receiver;
        sendQuery(account, net, json_payload, title);
      })
    })
  });

	// (Auto)claim selected rewards
  $("#claim").on("click tap", function(event) {
    $('#claim').prop("disabled",true);
    event.preventDefault();
    let account = $('#hiveAccount').val().toLowerCase();

    if (account.length < 3) {
      $('#error').text('Minimum 3 letters');
      $('#claim').prop("disabled",false);
      return;
    }
    
    let url = "https://scot-api.hive-engine.com/@"+account+"?hive=1";
    const pending = []
    $.getJSON(url, function(data) {
      for (symbol in data) {
        if (data[symbol].pending_token > 0) {
          balance = (data[symbol].pending_token/100000000)
          pending.push({'symbol': symbol, 'balance': balance})
        }
      }

      if (pending.length <= 0) {
        $('#error').text('Don\'t find any rewards to claim :(');
        $('#claim').prop("disabled",false);
        return;
      }

      $('#title').text('Rewards to claim');

      pending.sort((a,b)=> (a.symbol > b.symbol ? 1 : -1))
      pending.forEach( (item) => {
        $('#tokens').append('<input class="token" type="checkbox" data-balance="'+item['balance']+'" id="'+item['symbol']+'" name="'+item['symbol']+'" /><label for="'+item['symbol']+'">'+item['balance']+' '+item['symbol']+'</label><br />')
      });

      $('#btns').append('<button id="claimNow">Claim your selected rewards now !</button>')
      $('#btns').append('<p>You can now Auto-claim (each a day) all Hive rewards & HiveEngine tokens !<p> <button id="autoclaim" href="#">Authorize hive.autoclaim</button>');
      addBack();
      
      // Autoclaim
			$("#autoclaim").on("click tap", function(event){
				$('#claim').prop("disabled",true)
				event.preventDefault();
				let account = $('#hiveAccount').val().toLowerCase();
				let authority = "hive.autoclaim";
				let role = "posting";
				let weight = "1";
				if (typeof hive_keychain === 'object') {
					hive_keychain.requestAddAccountAuthority(
						account,
						authority,
						role,
						weight,
						function (response) {
							$('#results').html('<h2>All your tokens are now autoclaimed !</h2>');
							addBack();
						}
					);
				} else {
					url = "https://hivesigner.com/authorize/hive.autoclaim";
					window.location.href = url;
				}
			})

      $('#accountForm').fadeOut('slow', function(){
        $('#results').fadeIn('slow')
      })

      $("#checkAll").on('click tap', function(){
        $('input:checkbox').not(this).prop('checked', this.checked);
      });

			// Claim rewards
      $('#claimNow').on('click tap', function() {
        json_payload = []
        $(".token:checkbox:checked").each(function() {
          json_payload.push({
            'symbol': $(this).attr('id')
          })
        });
        json_payload = JSON.stringify(json_payload)
        net = 'scot_claim_token';
        title = 'MultiStaker : Claim rewards';
        sendQuery(account, net, json_payload, title);
      })

    });
  });
});
