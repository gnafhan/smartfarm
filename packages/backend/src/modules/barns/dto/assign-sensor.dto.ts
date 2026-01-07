import { IsNotEmpty, IsString } from 'class-validator';

export class AssignSensorDto {
  @IsString()
  @IsNotEmpty()
  sensorId: string;
}
