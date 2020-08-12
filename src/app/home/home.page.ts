import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import {
  Camera,
  CameraResultType,
  CameraSource,
  Capacitor,
} from "@capacitor/core";
import { Platform, ActionSheetController } from "@ionic/angular";
import {
  Contacts,
  Contact,
  ContactFieldType,
} from "@ionic-native/contacts/ngx";

@Component({
  selector: "app-home",
  templateUrl: "home.page.html",
  styleUrls: ["home.page.scss"],
})
export class HomePage implements OnInit {
  @ViewChild("filePicker", { static: false }) filePickerRef: ElementRef<
    HTMLInputElement
  >;
  photo: SafeResourceUrl;
  isDesktop: boolean;
  myContacts: Contact[] = [];
  type: ContactFieldType[] = ["phoneNumbers"];
  constructor(
    private contacts: Contacts,
    private platform: Platform,
    private sanitizer: DomSanitizer,
    public actionSheetController: ActionSheetController
  ) {}

  ngOnInit() {
    if (
      (this.platform.is("mobile") && this.platform.is("hybrid")) ||
      this.platform.is("desktop")
    ) {
      this.isDesktop = true;
    }
  }
  async search(event) {
    if(event.srcElement.value.length === 0){
      this.loadContacts();
    }
    else if (event.srcElement.value.length > 3) {
      let options = {
        filter: event.srcElement.value,
        multiple: true,
        hasPhoneNumber: true,
      };
      this.contacts.find(this.type, options).then((contacts: Contact[]) => {
        this.myContacts = contacts;
        console.log("contacts", contacts);
      });
    }
  }

  loadContacts() {
    let options = {
      filter: "",
      multiple: true,
      hasPhoneNumber: true,
    };
    this.contacts.find(["*"], options).then((contacts: Contact[]) => {
      this.myContacts = contacts;
      console.log("contacts", contacts);
    });
  }
  async selectImage() {
    const actionSheet = await this.actionSheetController.create({
      header: "Select Image source",
      buttons: [
        {
          text: "Load from Library",
          handler: () => {
            this.getPicture("gallery");
          },
        },
        {
          text: "Use Camera",
          handler: () => {
            this.getCamera();
          },
        },
        {
          text: "Cancel",
          role: "cancel",
        },
      ],
    });
    await actionSheet.present();
  }

  async getPicture(type: string) {
    if (
      !Capacitor.isPluginAvailable("Camera") ||
      (this.isDesktop && type === "gallery")
    ) {
      this.filePickerRef.nativeElement.click();
      return;
    }

    const image = await Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      source: CameraSource.Photos,
      saveToGallery: false,
      correctOrientation: true,
      resultType: CameraResultType.DataUrl,
    });
    this.photo = this.sanitizer.bypassSecurityTrustResourceUrl(
      image && image.dataUrl
    );
    console.log("pic",this.photo);
  }

  async getCamera() {
    if (!Capacitor.isPluginAvailable("Camera")) {
      this.filePickerRef.nativeElement.click();
      return;
    }

    const image = await Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      source: CameraSource.Camera,
      saveToGallery: false,
      correctOrientation: true,
      resultType: CameraResultType.DataUrl,
    });
    this.photo = this.sanitizer.bypassSecurityTrustResourceUrl(
      image && image.dataUrl
    );
    console.log("cam",this.photo);
  }

  onFileChoose(event: Event) {
    const file = (event.target as HTMLInputElement).files[0];
    const pattern = /image-*/;
    const reader = new FileReader();

    if (!file.type.match(pattern)) {
      console.log("File format not supported");
      return;
    }

    reader.onload = () => {
      this.photo = reader.result.toString();
    };
    reader.readAsDataURL(file);
  }
}
