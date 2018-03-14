//requieres
var AWS = require("aws-sdk");
var fs = require('fs');

// Configure AWS SDK for JavaScript
AWS.config.update({region: 'us-east-1'});
AWS.config.loadFromPath('./config.json');

//Variables
var results ={};
var params = {};
var lambda = new AWS.Lambda({region: 'us-east-1', apiVersion: '2015-03-31'});
var lambdaParms = {
    FunctionName : 'sumFromS3',
    InvocationType : 'RequestResponse',
    LogType : 'None',
 };
 
//get numbers
var args = process.argv.slice(2);

if(args && args.length!=2){
    console.error("You must type two numbers");
    return;
}

var number1 = args[0];
var number2 = args[1];

//Create objects at S3 to store number1
var s3 = new AWS.S3();
    //Create number1
    s3.putObject(
        {
            Bucket: 'cem.itesm.coding',
            Key: 'number1',
            Body: number1,
            ACL: 'public-read'
        }
        ,
        function (resp) {
            console.log("Loaded S3 number1");

            //Create number1
            s3.putObject(
                {
                    Bucket: 'cem.itesm.coding',
                    Key: 'number2',
                    Body: number2,
                    ACL: 'public-read'
                }
                ,
                function (resp) {
                    console.log("Loaded S3 number2");

                    //Load readFromS3 function
                    params = {
                        Code: {
                            "ZipFile": fs.readFileSync('./readS3.zip')
                        }, 
                        Description: "", 
                        FunctionName: "readS3", 
                        Handler: "readS3.handler", // is of the form of the name of your source file and then name of your function handler
                        MemorySize: 128, 
                        Publish: true, 
                        Role: "arn:aws:iam::773710499283:role/AESCLambda", // replace with the actual arn of the execution role you created
                        Runtime: "nodejs6.10", 
                        Timeout: 15, 
                        VpcConfig: {
                        }
                    };
            
                    lambda.createFunction(params, function(err, data) {
                        //if (err) console.log(err, err.stack); // an error occurred

                        console.log("Loaded readS3 Lambda function");

                        //Load sumFromS3 function
                        var params = {
                            Code: {
                                "ZipFile": fs.readFileSync('./sumFromS3.zip')
                            }, 
                            Description: "", 
                            FunctionName: "sumFromS3", 
                            Handler: "sumFromS3.handler", // is of the form of the name of your source file and then name of your function handler
                            MemorySize: 128, 
                            Publish: true, 
                            Role: "arn:aws:iam::773710499283:role/AESCLambda", // replace with the actual arn of the execution role you created
                            Runtime: "nodejs6.10", 
                            Timeout: 15, 
                            VpcConfig: {
                            }
                        };
                
                        lambda.createFunction(params, function(err, data) {
                            //if (err) console.log(err, err.stack); // an error occurred

                            console.log("Loaded sumFromS3 Lambda function");

                            //INVOKING THE SUM FUNCTION
                            lambda.invoke(lambdaParms, function(err, data) {
                                console.log("Called sumFromS3 Lambda function");
                                if (err) {
                                   console.log("Error:"+ err);
                                } else {                                   
                                   console.log("result:" + JSON.stringify(data.Payload));
                                   
                                   //deleting functions:

                                   lambda.deleteFunction({FunctionName:"readS3"},function(err,data){
                                        if(err)
                                            console.error(err);
                                    
                                   });
                                   lambda.deleteFunction({FunctionName:"sumFromS3"},function(err,data){
                                    if(err)
                                        console.error( err);
                                
                                    });

                                   //deleting files
                                   s3.deleteObject({Bucket:"cem.itesm.coding",Key:"number1"},function(err,data){
                                    if(err)
                                        console.error( err);
                                
                                    });
                                   s3.deleteObject({Bucket:"cem.itesm.coding",Key:"number2"},function(err,data){
                                    if(err)
                                        console.error( err);                                
                                    });
                                }
                             });	
                          
                        });
                        

                    });
                                
                }
            )        
        }
    );

//Put function first
/*
var s3 = new AWS.S3();
    s3.putObject({
        Bucket: 'cem.itesm.coding',
        Key: 'function1.js',
        Body: code,
        ACL: 'public-read'
    },function (resp) {
        console.log(arguments);
        //var id = arguments[1].ETag;
        console.log('Successfully uploaded package.');

        // Prepare to call Lambda function
        var lambda = new AWS.Lambda({region: 'us-east-1', apiVersion: '2015-03-31'});

        var params = {
            Code: {
                "ZipFile": fs.readFileSync('./function1.zip')
            }, 
            Description: "", 
            FunctionName: "saveS3_1", 
            Handler: "function1.handler", // is of the form of the name of your source file and then name of your function handler
            MemorySize: 128, 
            Publish: true, 
            Role: "arn:aws:iam::773710499283:role/AESCLambda", // replace with the actual arn of the execution role you created
            Runtime: "nodejs6.10", 
            Timeout: 15, 
            VpcConfig: {
            }
        };

        lambda.createFunction(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data);           // successful response
        });

});
*/

