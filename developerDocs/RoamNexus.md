# Nexus JS for ROAM

RoAM has a lof of suppor for custom code generation and exploit injection, you can do a huge amount of things using this.

Feel free to add your own custom things and pull request it to the project!

## Custom Commands

### Send an Alert

`Nexus:Send('alert', {Content="Hello World!"})`

### Send a Notification

`Nexus:Send('notify', {Content="Hello World!"})`

### Close Roblox Client

`Nexus:Send('close', {Content="true"})`

### Rejoin Roblox

`Nexus:Send('rejoin', {Content={uid = Player.UserId, wait = 1000}})`